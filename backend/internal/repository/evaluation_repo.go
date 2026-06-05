package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

// EvaluationRepository handles data access for evaluations.
type EvaluationRepository struct {
	db *pgxpool.Pool
}

// NewEvaluationRepository creates a new EvaluationRepository.
func NewEvaluationRepository(db *pgxpool.Pool) *EvaluationRepository {
	return &EvaluationRepository{db: db}
}

// AssignJudge assigns an application to a judge.
func (r *EvaluationRepository) AssignJudge(ctx context.Context, appID, judgeID uuid.UUID) error {
	query := `
		INSERT INTO evaluations (id, application_id, judge_id, status, assigned_at)
		VALUES ($1, $2, $3, 'assigned', $4)
	`
	_, err := r.db.Exec(ctx, query, uuid.New(), appID, judgeID, time.Now())
	if err != nil {
		return fmt.Errorf("assigning judge: %w", err)
	}
	return nil
}

// GetJudgeEvaluations returns all evaluations assigned to a specific judge.
func (r *EvaluationRepository) GetJudgeEvaluations(ctx context.Context, judgeID uuid.UUID) ([]model.Evaluation, error) {
	query := `
		SELECT id, application_id, judge_id, status, total_score, comments, evaluated_at, assigned_at
		FROM evaluations
		WHERE judge_id = $1
		ORDER BY assigned_at DESC
	`
	rows, err := r.db.Query(ctx, query, judgeID)
	if err != nil {
		return nil, fmt.Errorf("querying judge evaluations: %w", err)
	}
	defer rows.Close()

	var evals []model.Evaluation
	for rows.Next() {
		var e model.Evaluation
		if err := rows.Scan(
			&e.ID, &e.ApplicationID, &e.JudgeID, &e.Status,
			&e.TotalScore, &e.Comments, &e.EvaluatedAt, &e.AssignedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning evaluation: %w", err)
		}
		evals = append(evals, e)
	}

	return evals, nil
}

// SubmitScores saves the scores for an evaluation and marks it completed.
func (r *EvaluationRepository) SubmitScores(ctx context.Context, evalID uuid.UUID, req model.SubmitScoreRequest) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var totalScore float64

	// Insert individual scores
	scoreQuery := `
		INSERT INTO evaluation_scores (id, evaluation_id, criteria_id, score, notes)
		VALUES ($1, $2, $3, $4, $5)
	`
	for _, s := range req.Scores {
		totalScore += s.Score
		_, err := tx.Exec(ctx, scoreQuery, uuid.New(), evalID, s.CriteriaID, s.Score, s.Notes)
		if err != nil {
			return fmt.Errorf("inserting score for criteria %s: %w", s.CriteriaID, err)
		}
	}

	// Update evaluation status
	updateQuery := `
		UPDATE evaluations 
		SET status = 'completed', total_score = $1, comments = $2, evaluated_at = $3
		WHERE id = $4
	`
	_, err = tx.Exec(ctx, updateQuery, totalScore, req.Comments, time.Now(), evalID)
	if err != nil {
		return fmt.Errorf("updating evaluation status: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}

	return nil
}
