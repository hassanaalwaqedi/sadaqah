package model

import (
	"time"

	"github.com/google/uuid"
)

// ScholarshipCycleConfig holds dynamic configuration for a cycle
type ScholarshipCycleConfig map[string]interface{}

type ScholarshipCycle struct {
	ID                  uuid.UUID               `json:"id"`
	NameEn              string                  `json:"name_en"`
	NameAr              string                  `json:"name_ar"`
	Description         *string                 `json:"description,omitempty"`
	AcademicYear        string                  `json:"academic_year"`
	ApplicationStart    time.Time               `json:"application_start"`
	ApplicationDeadline time.Time               `json:"application_deadline"`
	EvaluationDeadline  *time.Time              `json:"evaluation_deadline,omitempty"`
	TotalQuota          int                     `json:"total_quota"`
	Status              string                  `json:"status"`
	Configuration       *ScholarshipCycleConfig `json:"configuration,omitempty"`
	CreatedBy           *uuid.UUID              `json:"created_by,omitempty"`
	CreatedAt           time.Time               `json:"created_at"`
	UpdatedAt           time.Time               `json:"updated_at"`
	DeletedAt           *time.Time              `json:"-"`
}

type ScholarshipApplication struct {
	ID                   uuid.UUID              `json:"id"`
	CycleID              uuid.UUID              `json:"cycle_id"`
	ApplicantID          uuid.UUID              `json:"applicant_id"`
	Status               string                 `json:"status"`
	SubmittedAt          *time.Time             `json:"submitted_at,omitempty"`
	GpaVerified          *float64               `json:"gpa_verified,omitempty"`
	FamilyIncome         *float64               `json:"family_income,omitempty"`
	FamilySize           *int16                 `json:"family_size,omitempty"`
	DistanceKm           *float64               `json:"distance_km,omitempty"`
	SpecialCircumstances *string                `json:"special_circumstances,omitempty"`
	AdminNotes           *string                `json:"admin_notes,omitempty"`
	FinalScore           *float64               `json:"final_score,omitempty"`
	FinalRank            *int                   `json:"final_rank,omitempty"`
	ExtraData            map[string]interface{} `json:"extra_data,omitempty"`
	AssignedTo           *uuid.UUID             `json:"assigned_to,omitempty"`
	ReviewerID           *uuid.UUID             `json:"reviewer_id,omitempty"`
	Department           *string                `json:"department,omitempty"`
	Committee            *string                `json:"committee,omitempty"`
	SLADeadline          *time.Time             `json:"sla_deadline,omitempty"`
	Priority             *string                `json:"priority,omitempty"`
	CreatedAt            time.Time              `json:"created_at"`
	UpdatedAt            time.Time              `json:"updated_at"`
}

type CreateCycleRequest struct {
	NameEn              string                  `json:"name_en"`
	NameAr              string                  `json:"name_ar"`
	Description         string                  `json:"description"`
	AcademicYear        string                  `json:"academic_year"`
	ApplicationStart    time.Time               `json:"application_start"`
	ApplicationDeadline time.Time               `json:"application_deadline"`
	EvaluationDeadline  *time.Time              `json:"evaluation_deadline"`
	TotalQuota          int                     `json:"total_quota"`
	Status              string                  `json:"status"`
	Configuration       *ScholarshipCycleConfig `json:"configuration,omitempty"`
}

type UpdateCycleRequest struct {
	NameEn              *string                  `json:"name_en,omitempty"`
	NameAr              *string                  `json:"name_ar,omitempty"`
	Description         *string                  `json:"description,omitempty"`
	AcademicYear        *string                  `json:"academic_year,omitempty"`
	ApplicationStart    *time.Time               `json:"application_start,omitempty"`
	ApplicationDeadline *time.Time               `json:"application_deadline,omitempty"`
	EvaluationDeadline  *time.Time               `json:"evaluation_deadline,omitempty"`
	TotalQuota          *int                     `json:"total_quota,omitempty"`
	Status              *string                  `json:"status,omitempty"`
	Configuration       *ScholarshipCycleConfig  `json:"configuration,omitempty"`
}

type CreateApplicationRequest struct {
	NationalID           string                 `json:"national_id"`
	University           string                 `json:"university"`
	Major                string                 `json:"major"`
	Gpa                  float64                `json:"gpa"`
	AcademicYear         int16                  `json:"academic_year"`
	FamilyIncome         float64                `json:"family_income"`
	FamilySize           int16                  `json:"family_size"`
	TranscriptFileObj    string                 `json:"transcript_file_obj"`
	IDCardFileObj        string                 `json:"id_card_file_obj"`
	RecommendationLetter *string                `json:"recommendation_letter,omitempty"`
	Status               string                 `json:"status"`
	ExtraData            map[string]interface{} `json:"extra_data,omitempty"`
}

type AssignCaseRequest struct {
	AssignedTo  *uuid.UUID `json:"assigned_to"`
	ReviewerID  *uuid.UUID `json:"reviewer_id"`
	Department  *string    `json:"department"`
	Committee   *string    `json:"committee"`
	SLADeadline *time.Time `json:"sla_deadline"`
}

type UpdatePriorityRequest struct {
	Priority string `json:"priority"`
}

type ScholarshipEvaluation struct {
	ID            uuid.UUID                    `json:"id"`
	ApplicationID uuid.UUID                    `json:"application_id"`
	JudgeID       uuid.UUID                    `json:"judge_id"`
	Status        string                       `json:"status"`
	TotalScore    *float64                     `json:"total_score,omitempty"`
	Comments      *string                      `json:"comments,omitempty"`
	EvaluatedAt   *time.Time                   `json:"evaluated_at,omitempty"`
	AssignedAt    time.Time                    `json:"assigned_at"`
	Scores        []ScholarshipEvaluationScore `json:"scores,omitempty"`
}

type ScholarshipEvaluationScore struct {
	ID           uuid.UUID `json:"id"`
	EvaluationID uuid.UUID `json:"evaluation_id"`
	CriteriaID   uuid.UUID `json:"criteria_id"`
	CriteriaName string    `json:"criteria_name"`
	Score        float64   `json:"score"`
	Notes        *string   `json:"notes,omitempty"`
}

type ScholarshipTimeline struct {
	ID            uuid.UUID  `json:"id"`
	ApplicationID uuid.UUID  `json:"application_id"`
	UserID        *uuid.UUID `json:"user_id,omitempty"`
	StatusFrom    *string    `json:"status_from,omitempty"`
	StatusTo      string     `json:"status_to"`
	Notes         *string    `json:"notes,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type ScholarshipMessage struct {
	ID            uuid.UUID `json:"id"`
	ApplicationID uuid.UUID `json:"application_id"`
	SenderID      uuid.UUID `json:"sender_id"`
	Message       string    `json:"message"`
	IsInternal    bool      `json:"is_internal"`
	CreatedAt     time.Time `json:"created_at"`
}
