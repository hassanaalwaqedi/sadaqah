package model

import (
	"time"

	"github.com/google/uuid"
)

// ScholarshipCycle represents a scholarship cycle record.
type ScholarshipCycle struct {
	ID                  uuid.UUID  `json:"id"`
	NameEn              string     `json:"name_en"`
	NameAr              string     `json:"name_ar"`
	Description         *string    `json:"description,omitempty"`
	AcademicYear        string     `json:"academic_year"`
	ApplicationStart    time.Time  `json:"application_start"`
	ApplicationDeadline time.Time  `json:"application_deadline"`
	EvaluationDeadline  *time.Time `json:"evaluation_deadline,omitempty"`
	TotalQuota          int        `json:"total_quota"`
	Status              string     `json:"status"`
	CreatedBy           *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
}

// ScholarshipApplication represents a student's application.
type ScholarshipApplication struct {
	ID                   uuid.UUID  `json:"id"`
	CycleID              uuid.UUID  `json:"cycle_id"`
	ApplicantID          uuid.UUID  `json:"applicant_id"`
	Status               string     `json:"status"`
	SubmittedAt          *time.Time `json:"submitted_at,omitempty"`
	GpaVerified          *float64   `json:"gpa_verified,omitempty"`
	FamilyIncome         *float64   `json:"family_income,omitempty"`
	FamilySize           *int16     `json:"family_size,omitempty"`
	DistanceKm           *float64   `json:"distance_km,omitempty"`
	SpecialCircumstances *string    `json:"special_circumstances,omitempty"`
	AdminNotes           *string    `json:"admin_notes,omitempty"`
	FinalScore           *float64   `json:"final_score,omitempty"`
	FinalRank            *int       `json:"final_rank,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// CreateCycleRequest is the payload for creating a new cycle.
type CreateCycleRequest struct {
	NameEn              string     `json:"name_en"`
	NameAr              string     `json:"name_ar"`
	Description         string     `json:"description"`
	AcademicYear        string     `json:"academic_year"`
	ApplicationStart    time.Time  `json:"application_start"`
	ApplicationDeadline time.Time  `json:"application_deadline"`
	EvaluationDeadline  *time.Time `json:"evaluation_deadline"`
	TotalQuota          int        `json:"total_quota"`
}

// CreateApplicationRequest is the payload for student submission.
type CreateApplicationRequest struct {
	NationalID           string  `json:"national_id"`
	University           string  `json:"university"`
	Major                string  `json:"major"`
	Gpa                  float64 `json:"gpa"`
	AcademicYear         int16   `json:"academic_year"`
	FamilyIncome         float64 `json:"family_income"`
	FamilySize           int16   `json:"family_size"`
	TranscriptFileObj    string  `json:"transcript_file_obj"` // Object name from MinIO
	IDCardFileObj        string  `json:"id_card_file_obj"`    // Object name from MinIO
}
