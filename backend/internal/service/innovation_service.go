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

type InnovationService struct {
	repo   *repository.InnovationRepository
	logger *slog.Logger
}

func NewInnovationService(repo *repository.InnovationRepository, logger *slog.Logger) *InnovationService {
	return &InnovationService{
		repo:   repo,
		logger: logger,
	}
}

func (s *InnovationService) CreateEvent(ctx context.Context, nameEn, nameAr, desc string, deadline time.Time, config map[string]interface{}, creatorID string) (*model.InnovationEvent, error) {
	cID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	event := &model.InnovationEvent{
		NameEn:             nameEn,
		NameAr:             nameAr,
		Description:        desc,
		SubmissionDeadline: deadline,
		Status:             "open",
		Configuration:      config,
		CreatedBy:          cID,
	}

	if err := s.repo.CreateEvent(ctx, event); err != nil {
		s.logger.Error("Failed to create innovation event", "error", err)
		return nil, err
	}
	return event, nil
}

func (s *InnovationService) GetEvents(ctx context.Context) ([]model.InnovationEvent, error) {
	return s.repo.GetActiveEvents(ctx)
}

func (s *InnovationService) GetEventByID(ctx context.Context, id string) (*model.InnovationEvent, error) {
	uID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid event ID: %w", err)
	}
	return s.repo.GetEventByID(ctx, uID)
}

func (s *InnovationService) GetMyProjects(ctx context.Context, userID string) ([]model.ProjectSubmission, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}
	return s.repo.GetMyProjects(ctx, uID)
}

func (s *InnovationService) SubmitProject(ctx context.Context, categoryID, submitterID, title, abstract, desc string, extraData map[string]interface{}) (*model.ProjectSubmission, error) {
	cID, err := uuid.Parse(categoryID)
	if err != nil {
		return nil, fmt.Errorf("invalid category ID: %w", err)
	}
	subID, err := uuid.Parse(submitterID)
	if err != nil {
		return nil, fmt.Errorf("invalid submitter ID: %w", err)
	}

	proj := &model.ProjectSubmission{
		CategoryID:  cID,
		SubmitterID: subID,
		Title:       title,
		Abstract:    abstract,
		Description: desc,
		ExtraData:   extraData,
	}

	if err := s.repo.SubmitProject(ctx, proj); err != nil {
		s.logger.Error("Failed to submit project", "error", err)
		return nil, err
	}
	return proj, nil
}

func (s *InnovationService) GetJudgingAssignments(ctx context.Context, judgeID string) ([]model.ProjectSubmission, error) {
	jID, err := uuid.Parse(judgeID)
	if err != nil {
		return nil, fmt.Errorf("invalid judge ID: %w", err)
	}
	return s.repo.GetJudgingAssignments(ctx, jID)
}

func (s *InnovationService) SubmitScores(ctx context.Context, assignmentID string, scores []model.JudgingScore) error {
	aID, err := uuid.Parse(assignmentID)
	if err != nil {
		return fmt.Errorf("invalid assignment ID: %w", err)
	}

	if err := s.repo.SubmitScore(ctx, aID, scores); err != nil {
		s.logger.Error("Failed to submit scores", "error", err, "assignment_id", assignmentID)
		return err
	}
	return nil
}

// ── Admin & Tracking Ecosystem ──

func (s *InnovationService) GetApplicationsByEvent(ctx context.Context, eventID string) ([]model.ProjectSubmission, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, fmt.Errorf("invalid event ID: %w", err)
	}
	return s.repo.GetApplicationsByEvent(ctx, eID)
}

func (s *InnovationService) GetApplicationDetails(ctx context.Context, projectID string) (*model.InnovationApplicationDetails, error) {
	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, fmt.Errorf("invalid project ID: %w", err)
	}

	sub, err := s.repo.GetApplicationByID(ctx, pID)
	if err != nil {
		return nil, err
	}

	event, err := s.repo.GetEventByID(ctx, sub.CategoryID) // Using category_id as event_id for simplicity, as noted
	if err != nil {
		return nil, err
	}

	timeline, err := s.repo.GetProjectTimeline(ctx, pID)
	if err != nil {
		timeline = []model.ProjectTimeline{}
	}

	// Always get all messages (we filter in the handler if needed based on RBAC)
	messages, err := s.repo.GetProjectMessages(ctx, pID, true)
	if err != nil {
		messages = []model.ProjectMessage{}
	}

	submitter, err := s.repo.GetSubmitterProfile(ctx, sub.SubmitterID)
	if err != nil {
		s.logger.Warn("Failed to fetch submitter profile", "error", err)
		submitter = &model.UserWithProfile{}
	}

	assignments, err := s.repo.GetJudgingAssignmentsByProject(ctx, pID)
	if err != nil {
		assignments = []model.JudgingAssignment{}
	}

	scores, err := s.repo.GetJudgingScoresByProject(ctx, pID)
	if err != nil {
		scores = []model.JudgingScore{}
	}

	return &model.InnovationApplicationDetails{
		Submission:   *sub,
		Event:        *event,
		Submitter:    *submitter,
		Timeline:     timeline,
		Messages:     messages,
		Team:         []model.ProjectTeamMember{}, // Placeholder for team
		Certificates: []model.ProjectCertificate{}, // Placeholder for certs
		Assignments:  assignments,
		Scores:       scores,
	}, nil
}

func (s *InnovationService) UpdateApplicationStatus(ctx context.Context, projectID, newStatus, message, userID string, isInternal bool) error {
	pID, err := uuid.Parse(projectID)
	if err != nil {
		return fmt.Errorf("invalid project ID: %w", err)
	}

	uID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	sub, err := s.repo.GetApplicationByID(ctx, pID)
	if err != nil {
		return err
	}

	if sub.Status == newStatus {
		return nil // No change
	}

	oldStatus := sub.Status

	if err := s.repo.UpdateApplicationStatus(ctx, pID, newStatus); err != nil {
		return err
	}

	// Log to timeline
	timeline := &model.ProjectTimeline{
		ProjectID:   pID,
		UserID:      &uID,
		StatusFrom:  &oldStatus,
		StatusTo:    newStatus,
		Title:       "تحديث حالة الطلب",
		Description: fmt.Sprintf("تم تحديث حالة الطلب من %s إلى %s", oldStatus, newStatus),
	}
	_ = s.repo.InsertProjectTimeline(ctx, timeline)

	// If there is an optional message, log it too
	if message != "" {
		msg := &model.ProjectMessage{
			ProjectID:  pID,
			SenderID:   uID,
			Message:    message,
			IsInternal: isInternal,
		}
		_ = s.repo.InsertProjectMessage(ctx, msg)
	}

	return nil
}

func (s *InnovationService) AddApplicationMessage(ctx context.Context, projectID, senderID, message string, isInternal bool) error {
	pID, err := uuid.Parse(projectID)
	if err != nil {
		return fmt.Errorf("invalid project ID: %w", err)
	}

	sID, err := uuid.Parse(senderID)
	if err != nil {
		return fmt.Errorf("invalid sender ID: %w", err)
	}

	msg := &model.ProjectMessage{
		ProjectID:  pID,
		SenderID:   sID,
		Message:    message,
		IsInternal: isInternal,
	}

	return s.repo.InsertProjectMessage(ctx, msg)
}

