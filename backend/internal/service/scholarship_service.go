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
	repo   *repository.ScholarshipRepository
	logger *slog.Logger
}

// NewScholarshipService creates a new ScholarshipService.
func NewScholarshipService(repo *repository.ScholarshipRepository, logger *slog.Logger) *ScholarshipService {
	return &ScholarshipService{
		repo:   repo,
		logger: logger,
	}
}

// CreateCycle creates a new scholarship cycle.
func (s *ScholarshipService) CreateCycle(ctx context.Context, req model.CreateCycleRequest, createdBy uuid.UUID) (*model.ScholarshipCycle, error) {
	desc := req.Description
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
		Status:              "draft", // Starts as draft
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

// ListCycles gets paginated cycles.
func (s *ScholarshipService) ListCycles(ctx context.Context, params model.PaginationParams) (model.PaginatedResponse, error) {
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

// SubmitApplication processes a student's application submission.
func (s *ScholarshipService) SubmitApplication(ctx context.Context, cycleID, applicantID uuid.UUID, req model.CreateApplicationRequest) error {
	// In a real application, we would create dummy file records for the MinIO objects 
	// here, or the frontend would call POST /files first to create DB records.
	// For now, we just insert the application record.
	
	now := time.Now()
	app := &model.ScholarshipApplication{
		ID:           uuid.New(),
		CycleID:      cycleID,
		ApplicantID:  applicantID,
		Status:       "submitted",
		SubmittedAt:  &now,
		FamilyIncome: &req.FamilyIncome,
		FamilySize:   &req.FamilySize,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.repo.CreateApplication(ctx, app); err != nil {
		return fmt.Errorf("creating application: %w", err)
	}

	// Trigger OCR task via Redis queue (to be implemented in Sprint 3)
	// s.queue.EnqueueOCRTask(docID)

	s.logger.Info("application submitted", slog.String("app_id", app.ID.String()), slog.String("applicant_id", applicantID.String()))
	return nil
}
