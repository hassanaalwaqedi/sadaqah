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

const SSENotificationsChannel = "sse.notifications"

type NotificationService struct {
	repo         *repository.NotificationRepository
	rbacSvc      *RBACService
	userRepo     *repository.UserRepository
	rdb          *redis.Client
	logger       *slog.Logger
	pubsub       *redis.PubSub
}

func NewNotificationService(repo *repository.NotificationRepository, rbacSvc *RBACService, userRepo *repository.UserRepository, rdb *redis.Client, logger *slog.Logger) *NotificationService {
	return &NotificationService{
		repo:     repo,
		rbacSvc:  rbacSvc,
		userRepo: userRepo,
		rdb:      rdb,
		logger:   logger,
	}
}

func (s *NotificationService) StartWorker(ctx context.Context) {
	s.pubsub = s.rdb.Subscribe(ctx, SystemEventsChannel)
	ch := s.pubsub.Channel()

	go func() {
		for {
			select {
			case <-ctx.Done():
				s.pubsub.Close()
				s.logger.Info("Notification worker stopped")
				return
			case msg := <-ch:
				var event model.SystemEvent
				if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
					s.logger.Error("Failed to unmarshal system event", "error", err)
					continue
				}
				s.handleEvent(ctx, &event)
			}
		}
	}()
	s.logger.Info("Notification worker started")
}

func (s *NotificationService) handleEvent(ctx context.Context, event *model.SystemEvent) {
	// Identify target users based on event_type and payload
	var targetUserIDs []uuid.UUID

	title := ""
	message := ""
	priority := "info"
	notifType := "alert"
	link := ""

	switch event.EventType {
	case "scholarship.status_changed":
		// Notify student
		if studentIDStr, ok := event.Payload["student_id"].(string); ok {
			if id, err := uuid.Parse(studentIDStr); err == nil {
				targetUserIDs = append(targetUserIDs, id)
			}
		}
		status := event.Payload["status"].(string)
		title = "تحديث حالة طلب المنحة"
		message = fmt.Sprintf("تم تحديث حالة طلبك إلى: %s", status)
		link = fmt.Sprintf("/portal/scholarships/my-applications/%s", event.TargetID.String())
		if status == "approved" || status == "awarded" {
			priority = "success"
		}

	case "scholarship.assigned":
		// Notify assigned case worker
		if workerIDStr, ok := event.Payload["assigned_to"].(string); ok {
			if id, err := uuid.Parse(workerIDStr); err == nil {
				targetUserIDs = append(targetUserIDs, id)
			}
		}
		title = "تم إسناد طلب جديد"
		message = "تم إسناد طلب منحة دراسية جديد لك للمراجعة."
		priority = "urgent"
		link = fmt.Sprintf("/portal/admin/scholarships/applications/%s", event.TargetID.String())

	case "scholarship.message_added":
		senderIDStr := event.Payload["sender_id"].(string)
		studentIDStr := event.Payload["student_id"].(string)
		isInternal := event.Payload["is_internal"].(bool)

		if isInternal {
			if assignedToStr, ok := event.Payload["assigned_to"].(string); ok && assignedToStr != senderIDStr {
				if id, err := uuid.Parse(assignedToStr); err == nil {
					targetUserIDs = append(targetUserIDs, id)
				}
			}
			title = "رسالة إدارية جديدة"
			message = "تم إضافة رسالة داخلية جديدة على الطلب."
			priority = "info"
			link = fmt.Sprintf("/portal/admin/scholarships/applications/%s", event.TargetID.String())
		} else {
			if senderIDStr == studentIDStr {
				if assignedToStr, ok := event.Payload["assigned_to"].(string); ok {
					if id, err := uuid.Parse(assignedToStr); err == nil {
						targetUserIDs = append(targetUserIDs, id)
					}
				}
				title = "رسالة جديدة من المتقدم"
				message = "لقد أرسل المتقدم رسالة جديدة على الطلب."
				priority = "info"
				link = fmt.Sprintf("/portal/admin/scholarships/applications/%s", event.TargetID.String())
			} else {
				if id, err := uuid.Parse(studentIDStr); err == nil {
					targetUserIDs = append(targetUserIDs, id)
				}
				title = "رسالة جديدة حول طلبك"
				message = "يوجد رد جديد من الإدارة بخصوص طلبك."
				priority = "info"
				link = fmt.Sprintf("/portal/scholarships/my-applications/%s", event.TargetID.String())
			}
		}

	case "innovation.project_submitted":
		// Notify student
		if studentIDStr, ok := event.Payload["submitter_id"].(string); ok {
			if id, err := uuid.Parse(studentIDStr); err == nil {
				targetUserIDs = append(targetUserIDs, id)
			}
		}
		title = "تم التقديم بنجاح"
		message = "تم استلام مشروعك لمسابقة الابتكار بنجاح."
		priority = "success"
		link = fmt.Sprintf("/portal/innovation/%s", event.TargetID.String())

	case "admin.announcement":
		// Example of a broadcast event
		title = event.Payload["title"].(string)
		message = event.Payload["message"].(string)
		priority = event.Payload["priority"].(string)
		// Usually we'd query all active users or by role here. For now, empty array means no-op.
		
	default:
		s.logger.Debug("Unhandled event type", "event_type", event.EventType)
		return
	}

	if len(targetUserIDs) == 0 {
		return
	}

	// Create Notifications
	var notifs []model.Notification
	for _, uid := range targetUserIDs {
		notifs = append(notifs, model.Notification{
			UserID:   uid,
			EventID:  &event.ID,
			Type:     notifType,
			Priority: priority,
			Title:    title,
			Message:  message,
			Link:     link,
			Metadata: map[string]interface{}{"source": event.SourceModule},
		})
	}

	// Save to DB
	if err := s.repo.CreateNotificationsBatch(ctx, notifs); err != nil {
		s.logger.Error("Failed to save notifications", "error", err)
		return
	}

	// Route to active SSE clients
	// Since CreateNotificationsBatch does not return the created IDs currently,
	// we re-fetch them or just broadcast the non-ID ones to the UI (UI generates temporary IDs).
	// For production, we would use RETURNING inside the batch or broadcast the payload.
	for _, n := range notifs {
		// Generate UUID for real-time delivery
		n.ID = uuid.New()
		n.CreatedAt = event.CreatedAt
		
		b, _ := json.Marshal(n)
		s.rdb.Publish(ctx, SSENotificationsChannel, b)
	}
}

// ── Standard CRUD ──

func (s *NotificationService) GetUserNotifications(ctx context.Context, userID string, limit, offset int, unreadOnly bool) ([]model.Notification, int, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, 0, err
	}
	return s.repo.GetUserNotifications(ctx, uID, limit, offset, unreadOnly)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, id, userID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	nID, err := uuid.Parse(id)
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

func (s *NotificationService) GetPreferences(ctx context.Context, userID string) (*model.NotificationPreference, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}
	return s.repo.GetPreferences(ctx, uID)
}

func (s *NotificationService) UpdatePreferences(ctx context.Context, userID string, p *model.NotificationPreference) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	p.UserID = uID
	return s.repo.UpdatePreferences(ctx, p)
}
