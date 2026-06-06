package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(ctx context.Context, n *model.Notification) error {
	query := `
		INSERT INTO notifications (user_id, type, title, body, data, is_read)
		VALUES ($1, $2, $3, $4, $5, false)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query, n.UserID, n.Type, n.Title, n.Body, n.Data).Scan(&n.ID, &n.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}
	return nil
}

func (r *NotificationRepository) GetForUser(ctx context.Context, userID uuid.UUID) ([]model.Notification, error) {
	query := `
		SELECT id, user_id, type, title, body, data, is_read, read_at, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}
	defer rows.Close()

	var notifications []model.Notification
	for rows.Next() {
		var n model.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.Data, &n.IsRead, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, nil
}

func (r *NotificationRepository) MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	query := `
		UPDATE notifications
		SET is_read = true, read_at = NOW()
		WHERE id = $1 AND user_id = $2
	`
	_, err := r.db.Exec(ctx, query, notificationID, userID)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}
	return nil
}

func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE notifications
		SET is_read = true, read_at = NOW()
		WHERE user_id = $1 AND is_read = false
	`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}
	return nil
}
