package model

import (
	"time"

	"github.com/google/uuid"
)

type InnovationEvent struct {
	ID                 uuid.UUID              `json:"id"`
	NameEn             string                 `json:"name_en"`
	NameAr             string                 `json:"name_ar"`
	Description        string                 `json:"description,omitempty"`
	EventDate          *time.Time             `json:"event_date,omitempty"`
	SubmissionDeadline time.Time              `json:"submission_deadline"`
	Status             string                 `json:"status"` // draft, upcoming, open, judging, completed, archived
	EventType          *string                `json:"event_type,omitempty"`
	Configuration      map[string]interface{} `json:"configuration,omitempty"`
	CreatedBy          uuid.UUID              `json:"created_by,omitempty"`
	CreatedAt          time.Time              `json:"created_at"`
}

type EventCategory struct {
	ID          uuid.UUID `json:"id"`
	EventID     uuid.UUID `json:"event_id"`
	NameEn      string    `json:"name_en"`
	NameAr      string    `json:"name_ar"`
	Description string    `json:"description,omitempty"`
	MaxTeamSize int       `json:"max_team_size"`
	SortOrder   int       `json:"sort_order"`
}

type ProjectSubmission struct {
	ID               uuid.UUID              `json:"id"`
	CategoryID       uuid.UUID              `json:"category_id"`
	SubmitterID      uuid.UUID              `json:"submitter_id"`
	Title            string                 `json:"title"`
	Abstract         string                 `json:"abstract"`
	Description      string                 `json:"description,omitempty"`
	Status           string                 `json:"status"` // draft, submitted, under_review, etc.
	FinalScore       *float64               `json:"final_score,omitempty"`
	FinalRank        *int                   `json:"final_rank,omitempty"`
	ExtraData        map[string]interface{} `json:"extra_data,omitempty"`
	AssignmentID     *uuid.UUID             `json:"assignment_id,omitempty"`
	AssignmentStatus *string                `json:"assignment_status,omitempty"`
	SubmittedAt      *time.Time             `json:"submitted_at,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
}

type ProjectTeamMember struct {
	ProjectID uuid.UUID `json:"project_id"`
	UserID    uuid.UUID `json:"user_id"`
	Role      string    `json:"role"`
	JoinedAt  time.Time `json:"joined_at"`
}

type JudgingAssignment struct {
	ID         uuid.UUID `json:"id"`
	ProjectID  uuid.UUID `json:"project_id"`
	JudgeID    uuid.UUID `json:"judge_id"`
	Status     string    `json:"status"` // assigned, in_progress, completed
	AssignedAt time.Time `json:"assigned_at"`
}

type JudgingScore struct {
	ID           uuid.UUID `json:"id"`
	AssignmentID uuid.UUID `json:"assignment_id"`
	CriteriaName string    `json:"criteria_name"`
	Score        float64   `json:"score"`
	MaxScore     float64   `json:"max_score"`
	Notes        string    `json:"notes,omitempty"`
}

type ProjectTimeline struct {
	ID          uuid.UUID  `json:"id"`
	ProjectID   uuid.UUID  `json:"project_id"`
	UserID      *uuid.UUID `json:"user_id,omitempty"`
	StatusFrom  *string    `json:"status_from,omitempty"`
	StatusTo    string     `json:"status_to"`
	Title       string     `json:"title"`
	Description string     `json:"description,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type ProjectMessage struct {
	ID         uuid.UUID `json:"id"`
	ProjectID  uuid.UUID `json:"project_id"`
	SenderID   uuid.UUID `json:"sender_id"`
	Message    string    `json:"message"`
	IsInternal bool      `json:"is_internal"`
	CreatedAt  time.Time `json:"created_at"`
}

type ProjectCertificate struct {
	ID              uuid.UUID  `json:"id"`
	ProjectID       uuid.UUID  `json:"project_id"`
	UserID          uuid.UUID  `json:"user_id"`
	CertificateType string     `json:"certificate_type"`
	FileID          *uuid.UUID `json:"file_id,omitempty"`
	IssuedAt        time.Time  `json:"issued_at"`
}
