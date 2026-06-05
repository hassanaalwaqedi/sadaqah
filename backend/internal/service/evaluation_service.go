package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

// EvaluationService handles business logic for judges and evaluations.
type EvaluationService struct {
	repo   *repository.EvaluationRepository
	logger *slog.Logger
}

// NewEvaluationService creates a new EvaluationService.
func NewEvaluationService(repo *repository.EvaluationRepository, logger *slog.Logger) *EvaluationService {
	return &EvaluationService{
		repo:   repo,
		logger: logger,
	}
}

// GetJudgeEvaluations returns a list of assigned applications for a judge.
func (s *EvaluationService) GetJudgeEvaluations(ctx context.Context, judgeID uuid.UUID) ([]model.Evaluation, error) {
	evals, err := s.repo.GetJudgeEvaluations(ctx, judgeID)
	if err != nil {
		return nil, fmt.Errorf("getting judge evaluations: %w", err)
	}
	return evals, nil
}

// SubmitScores processes a judge's submitted rubric scores.
func (s *EvaluationService) SubmitScores(ctx context.Context, judgeID, evaluationID uuid.UUID, req model.SubmitScoreRequest) error {
	// 1. Validate that the evaluation belongs to the judge and is not already completed
	// (Omitted for brevity in prototype)

	if err := s.repo.SubmitScores(ctx, evaluationID, req); err != nil {
		return fmt.Errorf("submitting scores: %w", err)
	}

	s.logger.Info("evaluation completed", slog.String("evaluation_id", evaluationID.String()), slog.String("judge_id", judgeID.String()))
	return nil
}
