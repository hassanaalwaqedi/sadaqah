package model

import (
	"time"
	"encoding/json"
	"github.com/google/uuid"
)

type UserInterest struct {
	UserID    uuid.UUID `json:"user_id"`
	Interest  string    `json:"interest"`
	CreatedAt time.Time `json:"created_at"`
}

type UserDocument struct {
	ID           uuid.UUID       `json:"id"`
	UserID       uuid.UUID       `json:"user_id"`
	DocumentType string          `json:"document_type"`
	FileURL      string          `json:"file_url"`
	Metadata     json.RawMessage `json:"metadata,omitempty"`
	UploadedAt   time.Time       `json:"uploaded_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type DonorProfile struct {
	UserID             uuid.UUID `json:"user_id"`
	DonorType          string    `json:"donor_type"`
	CompanyName        *string   `json:"company_name,omitempty"`
	PreferredCauses    []string  `json:"preferred_causes"`
	IsAnonymous        bool      `json:"is_anonymous"`
	TaxReceiptRequired bool      `json:"tax_receipt_required"`
	TotalDonated       float64   `json:"total_donated"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type ResearcherProfile struct {
	UserID             uuid.UUID `json:"user_id"`
	AcademicTitle      *string   `json:"academic_title,omitempty"`
	Institution        *string   `json:"institution,omitempty"`
	Department         *string   `json:"department,omitempty"`
	ResearchFields     []string  `json:"research_fields"`
	OrcidID            *string   `json:"orcid_id,omitempty"`
	GoogleScholarURL   *string   `json:"google_scholar_url,omitempty"`
	PublicationsCount  int       `json:"publications_count"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type InnovationProfile struct {
	UserID           uuid.UUID `json:"user_id"`
	Skills           []string  `json:"skills"`
	PortfolioURL     *string   `json:"portfolio_url,omitempty"`
	GithubURL        *string   `json:"github_url,omitempty"`
	LinkedinURL      *string   `json:"linkedin_url,omitempty"`
	PreviousProjects *string   `json:"previous_projects,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type VolunteerProfile struct {
	UserID         uuid.UUID `json:"user_id"`
	Skills         []string  `json:"skills"`
	Availability   *string   `json:"availability,omitempty"`
	PreferredRoles []string  `json:"preferred_roles"`
	TotalHours     int       `json:"total_hours"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type JudgeProfile struct {
	UserID             uuid.UUID `json:"user_id"`
	ExpertiseAreas     []string  `json:"expertise_areas"`
	Industry           *string   `json:"industry,omitempty"`
	YearsOfExperience  *int      `json:"years_of_experience,omitempty"`
	Company            *string   `json:"company,omitempty"`
	JobTitle           *string   `json:"job_title,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type ReviewerProfile struct {
	UserID            uuid.UUID `json:"user_id"`
	AcademicFocus     []string  `json:"academic_focus"`
	Institution       *string   `json:"institution,omitempty"`
	PeerReviewCount   int       `json:"peer_review_count"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type EmployeeProfile struct {
	UserID      uuid.UUID  `json:"user_id"`
	EmployeeID  *string    `json:"employee_id,omitempty"`
	Department  *string    `json:"department,omitempty"`
	JobTitle    *string    `json:"job_title,omitempty"`
	HireDate    *time.Time `json:"hire_date,omitempty"`
	ManagerID   *uuid.UUID `json:"manager_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type UniversalProfile struct {
	Identity      UserProfile          `json:"identity"`
	Interests     []string             `json:"interests"`
	Student       *StudentProfile      `json:"student,omitempty"`
	Donor         *DonorProfile        `json:"donor,omitempty"`
	Researcher    *ResearcherProfile   `json:"researcher,omitempty"`
	Innovation    *InnovationProfile   `json:"innovation,omitempty"`
	Volunteer     *VolunteerProfile    `json:"volunteer,omitempty"`
	Judge         *JudgeProfile        `json:"judge,omitempty"`
	Reviewer      *ReviewerProfile     `json:"reviewer,omitempty"`
	Employee      *EmployeeProfile     `json:"employee,omitempty"`
}
