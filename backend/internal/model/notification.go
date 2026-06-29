package model

import (
	"time"

	"github.com/google/uuid"
)

type SystemEvent struct {
	ID           uuid.UUID              `json:"id"`
	EventType    string                 `json:"event_type"`
	SourceModule string                 `json:"source_module"`
	TargetID     *uuid.UUID             `json:"target_id,omitempty"`
	ActorID      *uuid.UUID             `json:"actor_id,omitempty"`
	Payload      map[string]interface{} `json:"payload"`
	CreatedAt    time.Time              `json:"created_at"`
}

type Notification struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"user_id"`
	EventID   *uuid.UUID             `json:"event_id,omitempty"`
	Type      string                 `json:"type"`     // alert, message, update
	Priority  string                 `json:"priority"` // info, success, warning, urgent, critical
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Link      string                 `json:"link,omitempty"`
	ReadAt    *time.Time             `json:"read_at,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
}

type NotificationPreference struct {
	UserID          uuid.UUID `json:"user_id"`
	EmailEnabled    bool      `json:"email_enabled"`
	PushEnabled     bool      `json:"push_enabled"`
	MutedCategories []string  `json:"muted_categories"`
	UpdatedAt       time.Time `json:"updated_at"`
}
