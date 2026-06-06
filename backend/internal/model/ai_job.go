package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AIJobStatus represents the current status of an AI Job
type AIJobStatus string

const (
	AIJobStatusPending    AIJobStatus = "pending"
	AIJobStatusProcessing AIJobStatus = "processing"
	AIJobStatusCompleted  AIJobStatus = "completed"
	AIJobStatusFailed     AIJobStatus = "failed"
)

// AIJobType represents the type of AI Job
type AIJobType string

const (
	AIJobTypeOCR     AIJobType = "ocr"
	AIJobTypeRanking AIJobType = "ranking"
)

// AIJob represents a background task processed by the Python AI worker.
type AIJob struct {
	ID        uuid.UUID       `json:"id"`
	JobType   AIJobType       `json:"job_type"`
	Status    AIJobStatus     `json:"status"`
	Payload   json.RawMessage `json:"payload"`
	Result    json.RawMessage `json:"result,omitempty"`
	ErrorMsg  *string         `json:"error_msg,omitempty"`
	Retries   int             `json:"retries"`
	Progress  int             `json:"progress"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

// UpdateJobStatusRequest is the payload from Python to update status
type UpdateJobStatusRequest struct {
	Status   AIJobStatus `json:"status" validate:"required"`
	Progress int         `json:"progress"`
}

// FailJobRequest is the payload from Python to report a failure
type FailJobRequest struct {
	ErrorMsg string `json:"error_msg" validate:"required"`
}
