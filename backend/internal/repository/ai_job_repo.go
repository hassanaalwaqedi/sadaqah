package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

// AIJobRepository handles database operations for AI jobs.
type AIJobRepository struct {
	db *pgxpool.Pool
}

// NewAIJobRepository creates a new AIJobRepository.
func NewAIJobRepository(db *pgxpool.Pool) *AIJobRepository {
	return &AIJobRepository{db: db}
}

// Create inserts a new AI job.
func (r *AIJobRepository) Create(ctx context.Context, job *model.AIJob) error {
	query := `
		INSERT INTO ai_jobs (id, job_type, status, payload, retries, progress)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		job.ID,
		job.JobType,
		job.Status,
		job.Payload,
		job.Retries,
		job.Progress,
	).Scan(&job.CreatedAt, &job.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert ai_job: %w", err)
	}
	return nil
}

// GetByID retrieves an AI job by ID.
func (r *AIJobRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.AIJob, error) {
	query := `
		SELECT id, job_type, status, payload, result, error_msg, retries, progress, created_at, updated_at
		FROM ai_jobs
		WHERE id = $1
	`
	job := &model.AIJob{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&job.ID,
		&job.JobType,
		&job.Status,
		&job.Payload,
		&job.Result,
		&job.ErrorMsg,
		&job.Retries,
		&job.Progress,
		&job.CreatedAt,
		&job.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get ai_job: %w", err)
	}
	return job, nil
}

// UpdateStatus updates the status and progress of an AI job.
func (r *AIJobRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status model.AIJobStatus, progress int) error {
	query := `
		UPDATE ai_jobs
		SET status = $1, progress = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, status, progress, id)
	if err != nil {
		return fmt.Errorf("failed to update ai_job status: %w", err)
	}
	return nil
}

// MarkCompleted marks a job as completed and saves the result payload.
func (r *AIJobRepository) MarkCompleted(ctx context.Context, id uuid.UUID, result json.RawMessage) error {
	query := `
		UPDATE ai_jobs
		SET status = $1, result = $2, progress = 100, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, model.AIJobStatusCompleted, result, id)
	if err != nil {
		return fmt.Errorf("failed to mark ai_job completed: %w", err)
	}
	return nil
}

// RecordFailure increments the retry count and records the error message.
// Optionally changes status if retries exhausted. This logic is handled in the service layer,
// so this repository method just updates what it's told.
func (r *AIJobRepository) RecordFailure(ctx context.Context, id uuid.UUID, status model.AIJobStatus, errorMsg string, retries int) error {
	query := `
		UPDATE ai_jobs
		SET status = $1, error_msg = $2, retries = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, status, errorMsg, retries, id)
	if err != nil {
		return fmt.Errorf("failed to record ai_job failure: %w", err)
	}
	return nil
}
