package model

import (
	"time"

	"github.com/google/uuid"
)

// Evaluation represents a judge's evaluation of an application.
type Evaluation struct {
	ID            uuid.UUID  `json:"id"`
	ApplicationID uuid.UUID  `json:"application_id"`
	JudgeID       uuid.UUID  `json:"judge_id"`
	Status        string     `json:"status"` // assigned, in_progress, completed
	TotalScore    *float64   `json:"total_score,omitempty"`
	Comments      *string    `json:"comments,omitempty"`
	EvaluatedAt   *time.Time `json:"evaluated_at,omitempty"`
	AssignedAt    time.Time  `json:"assigned_at"`
}

// EvaluationScore represents a score for a specific criterion.
type EvaluationScore struct {
	ID           uuid.UUID `json:"id"`
	EvaluationID uuid.UUID `json:"evaluation_id"`
	CriteriaID   uuid.UUID `json:"criteria_id"`
	Score        float64   `json:"score"`
	Notes        *string   `json:"notes,omitempty"`
}

// SubmitScoreRequest is the payload for a judge submitting scores.
type SubmitScoreRequest struct {
	Scores []struct {
		CriteriaID uuid.UUID `json:"criteria_id"`
		Score      float64   `json:"score"`
		Notes      string    `json:"notes,omitempty"`
	} `json:"scores"`
	Comments string `json:"comments,omitempty"`
}
