package model

import (
	"time"

	"github.com/google/uuid"
)

// AuditLog represents a record in the audit_logs table.
type AuditLog struct {
	ID           uuid.UUID   `json:"id"`
	UserID       *uuid.UUID  `json:"user_id,omitempty"`
	Action       string      `json:"action"`
	EntityType   string      `json:"entity_type"`
	EntityID     uuid.UUID   `json:"entity_id"`
	OldValues    interface{} `json:"old_values,omitempty"`
	NewValues    interface{} `json:"new_values,omitempty"`
	IPAddress    string      `json:"ip_address,omitempty"`
	UserAgent    string      `json:"user_agent,omitempty"`
	RequestID    string      `json:"request_id,omitempty"`
	Success      bool        `json:"success"`
	TargetUserID *uuid.UUID  `json:"target_user_id,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}

// AuditLogCreate is the payload for creating a new audit log.
type AuditLogCreate struct {
	UserID       *uuid.UUID
	Action       string
	EntityType   string
	EntityID     uuid.UUID
	OldValues    interface{}
	NewValues    interface{}
	IPAddress    string
	UserAgent    string
	RequestID    string
	Success      bool
	TargetUserID *uuid.UUID
}
