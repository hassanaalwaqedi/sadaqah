package service

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type NotificationService struct {
	repo   *repository.NotificationRepository
	logger *slog.Logger
}

func NewNotificationService(repo *repository.NotificationRepository, logger *slog.Logger) *NotificationService {
	return &NotificationService{
		repo:   repo,
		logger: logger,
	}
}

// Send creates a new notification for a specific user
func (s *NotificationService) Send(ctx context.Context, userID uuid.UUID, nType string, title string, body string, data map[string]interface{}) error {
	notification := &model.Notification{
		UserID: userID,
		Type:   nType,
		Title:  title,
		Body:   body,
		Data:   data,
	}

	if err := s.repo.Create(ctx, notification); err != nil {
		s.logger.Error("Failed to create notification", "error", err, "user_id", userID)
		return err
	}

	// In a complete system, we might also push this via WebSockets/SSE here
	return nil
}

func (s *NotificationService) GetMyNotifications(ctx context.Context, userID string) ([]model.Notification, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}
	return s.repo.GetForUser(ctx, uID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID string, userID string) error {
	nID, err := uuid.Parse(notificationID)
	if err != nil {
		return err
	}
	uID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	return s.repo.MarkAsRead(ctx, nID, uID)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	return s.repo.MarkAllAsRead(ctx, uID)
}
