package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

// AIJobService manages the lifecycle and queuing of AI jobs.
type AIJobService struct {
	repo   *repository.AIJobRepository
	rdb    *redis.Client
	logger *slog.Logger
}

// NewAIJobService creates a new AIJobService.
func NewAIJobService(repo *repository.AIJobRepository, rdb *redis.Client, logger *slog.Logger) *AIJobService {
	return &AIJobService{
		repo:   repo,
		rdb:    rdb,
		logger: logger,
	}
}

// EnqueueJob saves the job to Postgres and pushes the payload to the Redis queue.
func (s *AIJobService) EnqueueJob(ctx context.Context, jobType model.AIJobType, payload json.RawMessage) (*model.AIJob, error) {
	job := &model.AIJob{
		ID:       uuid.New(),
		JobType:  jobType,
		Status:   model.AIJobStatusPending,
		Payload:  payload,
		Retries:  0,
		Progress: 0,
	}

	// 1. Persist to DB (Source of Truth)
	if err := s.repo.Create(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to create job in db: %w", err)
	}

	// 2. Push to Redis List (Message Broker)
	queueName := fmt.Sprintf("sadaqah:queue:%s", string(jobType))
	err := s.rdb.LPush(ctx, queueName, string(payload)).Err()
	if err != nil {
		s.logger.Error("failed to push job to redis",
			slog.String("job_id", job.ID.String()),
			slog.Any("error", err),
		)
		// Mark as failed if we couldn't enqueue it
		_ = s.repo.RecordFailure(ctx, job.ID, model.AIJobStatusFailed, "Failed to enqueue to Redis", 0)
		return nil, fmt.Errorf("failed to enqueue to redis: %w", err)
	}

	s.logger.Info("AI job enqueued successfully",
		slog.String("job_id", job.ID.String()),
		slog.String("type", string(jobType)),
	)
	return job, nil
}

// UpdateStatus updates the job's progress and status from the Python worker.
func (s *AIJobService) UpdateStatus(ctx context.Context, id uuid.UUID, status model.AIJobStatus, progress int) error {
	return s.repo.UpdateStatus(ctx, id, status, progress)
}

// CompleteJob marks the job as successfully completed.
func (s *AIJobService) CompleteJob(ctx context.Context, id uuid.UUID, result json.RawMessage) error {
	return s.repo.MarkCompleted(ctx, id, result)
}

// HandleFailure handles a job failure reported by the Python worker.
// Implements retry logic and Dead Letter Queue.
func (s *AIJobService) HandleFailure(ctx context.Context, id uuid.UUID, errorMsg string) error {
	job, err := s.repo.GetByID(ctx, id)
	if err != nil || job == nil {
		return fmt.Errorf("job not found or error retrieving job: %v", err)
	}

	job.Retries++
	
	// Max retries = 3
	if job.Retries >= 3 {
		s.logger.Warn("AI job exhausted retries, moving to Dead Letter state",
			slog.String("job_id", job.ID.String()),
			slog.String("error", errorMsg),
		)
		return s.repo.RecordFailure(ctx, id, model.AIJobStatusFailed, errorMsg, job.Retries)
	}

	s.logger.Info("AI job failed, retrying",
		slog.String("job_id", job.ID.String()),
		slog.Int("attempt", job.Retries),
		slog.String("error", errorMsg),
	)

	// Record the failure and set back to pending
	if err := s.repo.RecordFailure(ctx, id, model.AIJobStatusPending, errorMsg, job.Retries); err != nil {
		return err
	}

	// Re-enqueue to Redis
	queueName := fmt.Sprintf("sadaqah:queue:%s", string(job.JobType))
	if err := s.rdb.LPush(ctx, queueName, string(job.Payload)).Err(); err != nil {
		s.logger.Error("failed to re-enqueue job to redis", slog.Any("error", err))
		return err
	}

	return nil
}
