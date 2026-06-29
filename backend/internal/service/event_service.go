package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

const SystemEventsChannel = "system.events"

type EventService struct {
	repo   *repository.NotificationRepository
	rdb    *redis.Client
	logger *slog.Logger
}

func NewEventService(repo *repository.NotificationRepository, rdb *redis.Client, logger *slog.Logger) *EventService {
	return &EventService{
		repo:   repo,
		rdb:    rdb,
		logger: logger,
	}
}

// Publish creates a system event in the database and broadcasts it to the Redis bus for workers to process.
func (s *EventService) Publish(ctx context.Context, eventType, sourceModule string, targetID, actorID *uuid.UUID, payload map[string]interface{}) error {
	event := &model.SystemEvent{
		EventType:    eventType,
		SourceModule: sourceModule,
		TargetID:     targetID,
		ActorID:      actorID,
		Payload:      payload,
	}

	// 1. Persist to Postgres for Audit
	if err := s.repo.CreateSystemEvent(ctx, event); err != nil {
		s.logger.Error("Failed to persist system event", "event_type", eventType, "error", err)
		// We still try to publish it, or we could fail here. We'll fail to ensure consistency.
		return err
	}

	// 2. Publish to Redis Pub/Sub
	b, err := json.Marshal(event)
	if err != nil {
		s.logger.Error("Failed to serialize system event", "event_id", event.ID, "error", err)
		return err
	}

	if err := s.rdb.Publish(ctx, SystemEventsChannel, b).Err(); err != nil {
		s.logger.Error("Failed to publish system event to Redis", "event_id", event.ID, "error", err)
		return err
	}

	s.logger.Info("Published system event", "event_id", event.ID, "event_type", eventType)
	return nil
}
