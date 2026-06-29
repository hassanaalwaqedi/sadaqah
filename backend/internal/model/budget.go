package model

import (
	"time"

	"github.com/google/uuid"
)

type Budget struct {
	ID             uuid.UUID `json:"id" db:"id"`
	NameAr         string    `json:"name_ar" db:"name_ar"`
	NameEn         string    `json:"name_en" db:"name_en"`
	Description    string    `json:"description" db:"description"`
	DepartmentID   string    `json:"department_id" db:"department_id"`
	ProgramID      string    `json:"program_id" db:"program_id"`
	FiscalYear     string    `json:"fiscal_year" db:"fiscal_year"`
	StartDate      time.Time `json:"start_date" db:"start_date"`
	EndDate        time.Time `json:"end_date" db:"end_date"`
	Currency       string    `json:"currency" db:"currency"`
	Type           string    `json:"type" db:"type"`
	Status         string    `json:"status" db:"status"`
	TotalAmount    float64   `json:"total_amount" db:"total_amount"`
	SpentAmount    float64   `json:"spent_amount" db:"spent_amount"`
	ReservedAmount float64   `json:"reserved_amount" db:"reserved_amount"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	ApprovedBy     *uuid.UUID `json:"approved_by,omitempty" db:"approved_by"`
	Notes          string    `json:"notes" db:"notes"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`

	// Related collections (optional for fetching)
	Allocations    []BudgetAllocation    `json:"allocations,omitempty"`
	FundingSources []BudgetFundingSource `json:"funding_sources,omitempty"`
	Limits         []BudgetLimit         `json:"limits,omitempty"`
}

type BudgetAllocation struct {
	ID              uuid.UUID `json:"id" db:"id"`
	BudgetID        uuid.UUID `json:"budget_id" db:"budget_id"`
	ModuleType      string    `json:"module_type" db:"program"` // The DB column is still called 'program' in old schema, but wait!
	Category        string    `json:"category" db:"category"`
	AllocatedAmount float64   `json:"allocated_amount" db:"allocated_amount"`
	SpentAmount     float64   `json:"spent_amount" db:"spent_amount"`
	Notes           string    `json:"notes" db:"notes"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type BudgetFundingSource struct {
	ID         uuid.UUID `json:"id" db:"id"`
	BudgetID   uuid.UUID `json:"budget_id" db:"budget_id"`
	SourceType string    `json:"source_type" db:"source_type"`
	DonorName  string    `json:"donor_name" db:"donor_name"`
	Amount     float64   `json:"amount" db:"amount"`
	Notes      string    `json:"notes" db:"notes"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type BudgetLimit struct {
	ID             uuid.UUID `json:"id" db:"id"`
	BudgetID       uuid.UUID `json:"budget_id" db:"budget_id"`
	Period         string    `json:"period" db:"period"`
	MaxAmount      float64   `json:"max_amount" db:"max_amount"`
	AlertThreshold float64   `json:"alert_threshold" db:"alert_threshold"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}
