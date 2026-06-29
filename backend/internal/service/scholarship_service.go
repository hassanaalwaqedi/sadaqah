package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

// ScholarshipService handles business logic for scholarships.
type ScholarshipService struct {
	repo        *repository.ScholarshipRepository
	fileService *FileService
	logger      *slog.Logger
}

// NewScholarshipService creates a new ScholarshipService.
func NewScholarshipService(repo *repository.ScholarshipRepository, fileService *FileService, logger *slog.Logger) *ScholarshipService {
	return &ScholarshipService{
		repo:        repo,
		fileService: fileService,
		logger:      logger,
	}
}

// CreateCycle creates a new scholarship cycle.
func (s *ScholarshipService) CreateCycle(ctx context.Context, req model.CreateCycleRequest, createdBy uuid.UUID) (*model.ScholarshipCycle, error) {
	desc := req.Description
	status := "draft"
	if req.Status != "" {
		status = req.Status
	}

	cycle := &model.ScholarshipCycle{
		ID:                  uuid.New(),
		NameEn:              req.NameEn,
		NameAr:              req.NameAr,
		Description:         &desc,
		AcademicYear:        req.AcademicYear,
		ApplicationStart:    req.ApplicationStart,
		ApplicationDeadline: req.ApplicationDeadline,
		EvaluationDeadline:  req.EvaluationDeadline,
		TotalQuota:          req.TotalQuota,
		Status:              status,
		Configuration:       req.Configuration,
		CreatedBy:           &createdBy,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	if err := s.repo.CreateCycle(ctx, cycle); err != nil {
		return nil, fmt.Errorf("creating cycle: %w", err)
	}

	s.logger.Info("scholarship cycle created", slog.String("cycle_id", cycle.ID.String()))
	return cycle, nil
}

// GetCycleByID fetches a cycle by ID.
func (s *ScholarshipService) GetCycleByID(ctx context.Context, id uuid.UUID) (*model.ScholarshipCycle, error) {
	return s.repo.GetCycleByID(ctx, id)
}

// UpdateCycle updates an existing scholarship cycle.
func (s *ScholarshipService) UpdateCycle(ctx context.Context, id uuid.UUID, req model.UpdateCycleRequest) (*model.ScholarshipCycle, error) {
	cycle, err := s.repo.GetCycleByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("fetching cycle: %w", err)
	}

	if req.NameEn != nil {
		cycle.NameEn = *req.NameEn
	}
	if req.NameAr != nil {
		cycle.NameAr = *req.NameAr
	}
	if req.Description != nil {
		cycle.Description = req.Description
	}
	if req.AcademicYear != nil {
		cycle.AcademicYear = *req.AcademicYear
	}
	if req.ApplicationStart != nil {
		cycle.ApplicationStart = *req.ApplicationStart
	}
	if req.ApplicationDeadline != nil {
		cycle.ApplicationDeadline = *req.ApplicationDeadline
	}
	if req.EvaluationDeadline != nil {
		cycle.EvaluationDeadline = req.EvaluationDeadline
	}
	if req.TotalQuota != nil {
		cycle.TotalQuota = *req.TotalQuota
	}
	if req.Status != nil {
		cycle.Status = *req.Status
	}
	if req.Configuration != nil {
		cycle.Configuration = req.Configuration
	}

	cycle.UpdatedAt = time.Now()

	if err := s.repo.UpdateCycle(ctx, cycle); err != nil {
		return nil, fmt.Errorf("updating cycle: %w", err)
	}

	s.logger.Info("scholarship cycle updated", slog.String("cycle_id", cycle.ID.String()))
	return cycle, nil
}

// ListCycles gets paginated cycles.
func (s *ScholarshipService) ListCycles(ctx context.Context, params model.PaginationParams, statusFilter string) (model.PaginatedResponse, error) {
	cycles, total, err := s.repo.ListCycles(ctx, params)
	if err != nil {
		return model.PaginatedResponse{}, err
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(params.PageSize) - 1) / int64(params.PageSize))
	}

	return model.PaginatedResponse{
		Data:       cycles,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SubmitApplication processes a student's application submission or draft save.
func (s *ScholarshipService) SubmitApplication(ctx context.Context, cycleID, applicantID uuid.UUID, req model.CreateApplicationRequest) error {
	// Validate Transcript file if provided
	if req.TranscriptFileObj != "" {
		if err := s.fileService.ValidateFileSecurity(ctx, req.TranscriptFileObj); err != nil {
			s.logger.Warn("Malware or invalid file detected during application submission", 
				slog.String("applicant_id", applicantID.String()),
				slog.String("file", req.TranscriptFileObj),
				slog.String("error", err.Error()),
			)
			return fmt.Errorf("transcript validation failed: %w", err)
		}
	}

	// Validate ID Card file if provided
	if req.IDCardFileObj != "" {
		if err := s.fileService.ValidateFileSecurity(ctx, req.IDCardFileObj); err != nil {
			s.logger.Warn("Malware or invalid file detected during application submission", 
				slog.String("applicant_id", applicantID.String()),
				slog.String("file", req.IDCardFileObj),
				slog.String("error", err.Error()),
			)
			return fmt.Errorf("ID card validation failed: %w", err)
		}
	}

	now := time.Now()
	status := "submitted"
	if req.Status == "draft" {
		status = "draft"
	}
	var submittedAt *time.Time
	if status == "submitted" {
		submittedAt = &now
	}

	// Check if application already exists
	app, err := s.repo.GetApplicationByCycleAndApplicant(ctx, cycleID, applicantID)
	if err != nil {
		// Does not exist, create new
		app = &model.ScholarshipApplication{
			ID:           uuid.New(),
			CycleID:      cycleID,
			ApplicantID:  applicantID,
			Status:       status,
			SubmittedAt:  submittedAt,
			FamilyIncome: &req.FamilyIncome,
			FamilySize:   &req.FamilySize,
			ExtraData:    req.ExtraData,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if err := s.repo.CreateApplication(ctx, app); err != nil {
			return fmt.Errorf("creating application: %w", err)
		}
	} else {
		// Exists, update it
		if app.Status == "submitted" {
			return fmt.Errorf("application already submitted and cannot be modified")
		}

		app.Status = status
		app.SubmittedAt = submittedAt
		app.FamilyIncome = &req.FamilyIncome
		app.FamilySize = &req.FamilySize
		app.ExtraData = req.ExtraData
		app.UpdatedAt = now
		if err := s.repo.UpdateApplication(ctx, app); err != nil {
			return fmt.Errorf("updating application: %w", err)
		}
	}

	// Trigger OCR task via Redis queue (to be implemented in Sprint 3)
	// s.queue.EnqueueOCRTask(docID)

	s.logger.Info("application saved", slog.String("app_id", app.ID.String()), slog.String("applicant_id", applicantID.String()), slog.String("status", status))
	return nil
}

// GetCertificateData generates structured certificate data for an approved scholarship.
func (s *ScholarshipService) GetCertificateData(ctx context.Context, applicationID string) (map[string]interface{}, error) {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application ID: %w", err)
	}

	app, err := s.repo.GetApplicationByID(ctx, appID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve application: %w", err)
	}

	if app.Status != "approved" {
		return nil, fmt.Errorf("certificate can only be generated for approved applications")
	}

	// Fetch cycle and user details in a real scenario to populate certificate fully.
	data := map[string]interface{}{
		"certificate_id":     fmt.Sprintf("CERT-%s", app.ID.String()[:8]),
		"issue_date":         time.Now().Format("2006-01-02"),
		"program_name":       "Sadaqah Scholarship Program",
		"recipient_id":       app.ApplicantID,
		"authenticity_hash":  app.ID.String(), // Basic verifiable hash
	}

	return data, nil
}

// GetMyApplication gets a user's application for a given cycle.
func (s *ScholarshipService) GetMyApplication(ctx context.Context, cycleID, applicantID uuid.UUID) (*model.ScholarshipApplication, error) {
	return s.repo.GetApplicationByCycleAndApplicant(ctx, cycleID, applicantID)
}

// GetApplicationsByCycle gets all applications for a specific cycle.
func (s *ScholarshipService) GetApplicationsByCycle(ctx context.Context, cycleID string) ([]model.ScholarshipApplication, error) {
	cID, err := uuid.Parse(cycleID)
	if err != nil {
		return nil, fmt.Errorf("invalid cycle id: %w", err)
	}
	return s.repo.GetApplicationsByCycle(ctx, cID)
}

// GetMyApplications returns all applications submitted by the given student.
func (s *ScholarshipService) GetMyApplications(ctx context.Context, studentID uuid.UUID) ([]model.ScholarshipApplication, error) {
	return s.repo.GetApplicationsByApplicant(ctx, studentID)
}

// GetApplicationDetails retrieves the full details of a scholarship application.
func (s *ScholarshipService) GetApplicationDetails(ctx context.Context, applicationID string) (*model.ScholarshipApplication, error) {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application id: %w", err)
	}
	return s.repo.GetApplicationByID(ctx, appID)
}

// GetApplicationTimeline retrieves the timeline for an application.
func (s *ScholarshipService) GetApplicationTimeline(ctx context.Context, applicationID string) ([]model.ScholarshipTimeline, error) {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application id: %w", err)
	}
	return s.repo.GetScholarshipTimeline(ctx, appID)
}

// GetApplicationMessages retrieves the messages for an application.
func (s *ScholarshipService) GetApplicationMessages(ctx context.Context, applicationID string, includeInternal bool) ([]model.ScholarshipMessage, error) {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application id: %w", err)
	}
	return s.repo.GetScholarshipMessages(ctx, appID, includeInternal)
}

// UpdateApplicationStatus cleanly updates status and logs to timeline.
func (s *ScholarshipService) UpdateApplicationStatus(ctx context.Context, applicationID string, newStatus, reason string, userID uuid.UUID) error {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return fmt.Errorf("invalid application id: %w", err)
	}

	app, err := s.repo.GetApplicationByID(ctx, appID)
	if err != nil {
		return fmt.Errorf("application not found: %w", err)
	}

	oldStatus := app.Status
	if err := s.repo.UpdateApplicationStatus(ctx, appID, newStatus); err != nil {
		return fmt.Errorf("updating status: %w", err)
	}

	// Log to timeline
	timeline := &model.ScholarshipTimeline{
		ApplicationID: appID,
		UserID:        &userID,
		StatusFrom:    &oldStatus,
		StatusTo:      newStatus,
	}
	err = s.repo.InsertScholarshipTimeline(ctx, timeline)

	return err
}

// AddScholarshipMessage adds a new message and optionally logs it to the timeline.
func (s *ScholarshipService) AddScholarshipMessage(ctx context.Context, applicationID string, senderID uuid.UUID, message string, isInternal bool) (*model.ScholarshipMessage, error) {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application id: %w", err)
	}

	msg := &model.ScholarshipMessage{
		ID:            uuid.New(),
		ApplicationID: appID,
		SenderID:      senderID,
		Message:       message,
		IsInternal:    isInternal,
	}

	app, err := s.repo.GetApplicationByID(ctx, appID)
	if err != nil {
		return nil, fmt.Errorf("getting application: %w", err)
	}

	if err := s.repo.InsertScholarshipMessage(ctx, msg); err != nil {
		return nil, fmt.Errorf("inserting message: %w", err)
	}

	// Log to timeline (public messages only)
	if !isInternal {
		desc := "تم إضافة رسالة جديدة"
		timeline := &model.ScholarshipTimeline{
			ApplicationID: appID,
			UserID:        &senderID,
			StatusTo:      app.Status,
			Notes:         &desc,
		}
		_ = s.repo.InsertScholarshipTimeline(ctx, timeline)
	}

	return msg, nil
}

// GetAssignedCases gets cases assigned to a worker or committee
func (s *ScholarshipService) GetAssignedCases(ctx context.Context, userID uuid.UUID) ([]model.ScholarshipApplication, error) {
	return s.repo.GetApplicationsByAssignee(ctx, userID)
}

// AssignCase assigns a case worker and updates assignment tracking, logging to timeline.
func (s *ScholarshipService) AssignCase(ctx context.Context, applicationID string, actorID uuid.UUID, req model.AssignCaseRequest) error {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return fmt.Errorf("invalid application id: %w", err)
	}

	app, err := s.repo.GetApplicationByID(ctx, appID)
	if err != nil {
		return fmt.Errorf("application not found: %w", err)
	}

	if err = s.repo.AssignApplication(ctx, appID, &req); err != nil {
		return fmt.Errorf("updating assignment: %w", err)
	}

	// Create a timeline log
	desc := "تم تحديث تعيينات مسؤولي الحالة"
	if req.Department != nil {
		desc += fmt.Sprintf(" - القسم: %s", *req.Department)
	}
	timeline := &model.ScholarshipTimeline{
		ApplicationID: appID,
		UserID:        &actorID,
		StatusTo:      app.Status,
		Notes:         &desc,
	}
	_ = s.repo.InsertScholarshipTimeline(ctx, timeline)

	s.logger.Info("application assigned", slog.String("app_id", applicationID), slog.String("actor", actorID.String()))
	return nil
}

// UpdatePriority updates the priority of a scholarship application.
func (s *ScholarshipService) UpdatePriority(ctx context.Context, applicationID string, actorID uuid.UUID, req model.UpdatePriorityRequest) error {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return fmt.Errorf("invalid application id: %w", err)
	}

	if err := s.repo.UpdateApplicationPriority(ctx, appID, req.Priority); err != nil {
		return fmt.Errorf("updating priority: %w", err)
	}

	desc := fmt.Sprintf("تم تحديث أولوية الطلب إلى: %s", req.Priority)
	timeline := &model.ScholarshipTimeline{
		ApplicationID: appID,
		UserID:        &actorID,
		StatusTo:      "",
		Notes:         &desc,
	}
	_ = s.repo.InsertScholarshipTimeline(ctx, timeline)

	s.logger.Info("application priority updated", slog.String("app_id", applicationID), slog.String("priority", req.Priority))
	return nil
}

// GetApplicantProfile retrieves the applicant's profile
func (s *ScholarshipService) GetApplicantProfile(ctx context.Context, applicantID uuid.UUID) (*model.UserWithProfile, error) {
	return s.repo.GetApplicantProfile(ctx, applicantID)
}

// GetApplicationEvaluations retrieves evaluations and scores
func (s *ScholarshipService) GetApplicationEvaluations(ctx context.Context, applicationID string) ([]model.ScholarshipEvaluation, error) {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application id: %w", err)
	}
	return s.repo.GetEvaluationsByApplication(ctx, appID)
}

// SubmitApplicationScore saves the judge's score
func (s *ScholarshipService) SubmitApplicationScore(ctx context.Context, applicationID string, judgeID uuid.UUID, totalScore float64, comments string) error {
	appID, err := uuid.Parse(applicationID)
	if err != nil {
		return fmt.Errorf("invalid application id: %w", err)
	}
	return s.repo.SubmitScore(ctx, appID, judgeID, totalScore, &comments)
}
