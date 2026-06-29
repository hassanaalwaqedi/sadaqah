package model

import (
	"time"

	"github.com/google/uuid"
)

type ResearchGrantProgram struct {
	ID                  uuid.UUID `json:"id"`
	NameEn              string    `json:"name_en"`
	NameAr              string    `json:"name_ar"`
	Description         string    `json:"description,omitempty"`
	TotalBudgetPool     float64   `json:"total_budget_pool"`
	MaxBudgetPerProject float64   `json:"max_budget_per_project,omitempty"`
	ApplicationStart    time.Time `json:"application_start"`
	ApplicationDeadline time.Time `json:"application_deadline"`
	Status              string    `json:"status"` // draft, open, evaluating, closed
	CreatedBy           *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type ResearchProject struct {
	ID              uuid.UUID              `json:"id"`
	GrantProgramID  *uuid.UUID             `json:"grant_program_id,omitempty"`
	Title           string                 `json:"title"`
	Abstract        string                 `json:"abstract"`
	RequestedBudget float64                `json:"requested_budget"`
	ApprovedBudget  *float64               `json:"approved_budget,omitempty"`
	Status          string                 `json:"status"` // draft, submitted, under_review, approved, active, completed, rejected, cancelled
	StartDate       *time.Time             `json:"start_date,omitempty"`
	EndDate         *time.Time             `json:"end_date,omitempty"`
	ExtraData       map[string]interface{} `json:"extra_data,omitempty"`
	CreatedAt       time.Time              `json:"created_at"`
}

type ResearchTeamMember struct {
	ID        uuid.UUID `json:"id"`
	ProjectID uuid.UUID `json:"project_id"`
	UserID    uuid.UUID `json:"user_id"`
	Role      string    `json:"role"` // pi, co_pi, researcher, student
	JoinedAt  time.Time `json:"joined_at"`
}

type ResearchPublication struct {
	ID              uuid.UUID  `json:"id"`
	ProjectID       *uuid.UUID `json:"project_id,omitempty"`
	UserID          uuid.UUID  `json:"user_id"`
	Title           string     `json:"title"`
	PublicationType string     `json:"publication_type"` // journal, conference, book, dataset, patent
	JournalName     string     `json:"journal_name,omitempty"`
	PublicationDate *time.Time `json:"publication_date,omitempty"`
	DOI             string     `json:"doi,omitempty"`
	Abstract        string     `json:"abstract,omitempty"`
	FileID          *uuid.UUID `json:"file_id,omitempty"`
	Status          string     `json:"status"` // draft, submitted, published
	CreatedAt       time.Time  `json:"created_at"`
}
