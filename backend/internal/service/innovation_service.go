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

func (s *InnovationService) CreateEvent(ctx context.Context, nameEn, nameAr, desc string, deadline time.Time, creatorID string) (*model.InnovationEvent, error) {
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

func (s *InnovationService) SubmitProject(ctx context.Context, categoryID, submitterID, title, abstract, desc string) (*model.ProjectSubmission, error) {
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
