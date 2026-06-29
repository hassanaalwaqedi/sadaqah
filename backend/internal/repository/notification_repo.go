package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) CreateSystemEvent(ctx context.Context, e *model.SystemEvent) error {
	query := `
		INSERT INTO system_events (event_type, source_module, target_id, actor_id, payload)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	return r.db.QueryRow(ctx, query, e.EventType, e.SourceModule, e.TargetID, e.ActorID, e.Payload).Scan(&e.ID, &e.CreatedAt)
}

func (r *NotificationRepository) CreateNotification(ctx context.Context, n *model.Notification) error {
	query := `
		INSERT INTO notifications (user_id, event_id, type, priority, title, message, link, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`
	return r.db.QueryRow(ctx, query, n.UserID, n.EventID, n.Type, n.Priority, n.Title, n.Message, n.Link, n.Metadata).Scan(&n.ID, &n.CreatedAt)
}

func (r *NotificationRepository) CreateNotificationsBatch(ctx context.Context, notifications []model.Notification) error {
	if len(notifications) == 0 {
		return nil
	}

	batch := &pgx.Batch{}
	query := `
		INSERT INTO notifications (user_id, event_id, type, priority, title, message, link, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	for _, n := range notifications {
		batch.Queue(query, n.UserID, n.EventID, n.Type, n.Priority, n.Title, n.Message, n.Link, n.Metadata)
	}

	br := r.db.SendBatch(ctx, batch)
	defer br.Close()

	for i := 0; i < len(notifications); i++ {
		_, err := br.Exec()
		if err != nil {
			return fmt.Errorf("failed inserting batch notification %d: %w", i, err)
		}
	}
	return nil
}

func (r *NotificationRepository) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit, offset int, unreadOnly bool) ([]model.Notification, int, error) {
	whereClause := "WHERE user_id = $1 AND deleted_at IS NULL"
	args := []interface{}{userID}

	if unreadOnly {
		whereClause += " AND read_at IS NULL"
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM notifications %s`, whereClause)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, event_id, type, priority, title, message, link, read_at, metadata, created_at 
		FROM notifications 
		%s 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`, whereClause)

	args = append(args, limit, offset)
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var notifs []model.Notification
	for rows.Next() {
		var n model.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.EventID, &n.Type, &n.Priority, &n.Title, &n.Message, &n.Link, &n.ReadAt, &n.Metadata, &n.CreatedAt); err != nil {
			return nil, 0, err
		}
		notifs = append(notifs, n)
	}

	return notifs, total, nil
}

func (r *NotificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	query := `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL`
	_, err := r.db.Exec(ctx, query, id, userID)
	return err
}

func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL AND deleted_at IS NULL`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *NotificationRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*model.NotificationPreference, error) {
	query := `SELECT user_id, email_enabled, push_enabled, muted_categories, updated_at FROM notification_preferences WHERE user_id = $1`
	var p model.NotificationPreference
	err := r.db.QueryRow(ctx, query, userID).Scan(&p.UserID, &p.EmailEnabled, &p.PushEnabled, &p.MutedCategories, &p.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return &model.NotificationPreference{
				UserID:          userID,
				EmailEnabled:    true,
				PushEnabled:     true,
				MutedCategories: []string{},
			}, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *NotificationRepository) UpdatePreferences(ctx context.Context, p *model.NotificationPreference) error {
	query := `
		INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, muted_categories, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id) DO UPDATE SET 
			email_enabled = EXCLUDED.email_enabled,
			push_enabled = EXCLUDED.push_enabled,
			muted_categories = EXCLUDED.muted_categories,
			updated_at = NOW()
	`
	_, err := r.db.Exec(ctx, query, p.UserID, p.EmailEnabled, p.PushEnabled, p.MutedCategories)
	return err
}
