package model

import (
	"time"

	"github.com/google/uuid"
)




type FinancialTransaction struct {
	ID              uuid.UUID  `json:"id"`
	Type            string     `json:"type"` // income, expense, transfer
	Category        string     `json:"category"`
	Amount          float64    `json:"amount"`
	Currency        string     `json:"currency"`
	Description     string     `json:"description,omitempty"`
	ReferenceType   string     `json:"reference_type,omitempty"`
	ReferenceID          *uuid.UUID `json:"reference_id,omitempty"`
	BudgetID             *uuid.UUID `json:"budget_id,omitempty"`
	BudgetAllocationID   *uuid.UUID `json:"budget_allocation_id,omitempty"`
	RecordedBy      *uuid.UUID `json:"recorded_by,omitempty"`
	TransactionDate time.Time  `json:"transaction_date"`
	Status          string     `json:"status"`
	Source          string     `json:"source,omitempty"`
	Destination     string     `json:"destination,omitempty"`
	ReceiptFileID   *uuid.UUID `json:"receipt_file_id,omitempty"`
	InvoiceFileID   *uuid.UUID `json:"invoice_file_id,omitempty"`
	ApprovedBy      *uuid.UUID `json:"approved_by,omitempty"`
	Notes           string     `json:"notes,omitempty"`
	AuditHistory    []byte     `json:"audit_history,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}



type ExpenseRequest struct {
	ID                 uuid.UUID  `json:"id"`
	RequesterID        uuid.UUID  `json:"requester_id"`
	BudgetAllocationID *uuid.UUID `json:"budget_allocation_id,omitempty"`
	Amount             float64    `json:"amount"`
	Description        string     `json:"description"`
	Status             string     `json:"status"` // submitted, manager_approved, finance_approved, disbursed, rejected
	InvoiceFileID      *uuid.UUID `json:"invoice_file_id,omitempty"`
	ReceiptFileID      *uuid.UUID `json:"receipt_file_id,omitempty"`
	Category           string     `json:"category,omitempty"`
	Notes              string     `json:"notes,omitempty"`
	AuditHistory       []byte     `json:"audit_history,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// ── Research ──

type ResearchGrant struct {
	ID              uuid.UUID  `json:"id"`
	ResearcherID    uuid.UUID  `json:"researcher_id"`
	Title           string     `json:"title"`
	Abstract        string     `json:"abstract"`
	RequestedBudget float64    `json:"requested_budget"`
	ApprovedBudget  *float64   `json:"approved_budget,omitempty"`
	Status          string     `json:"status"` // proposed, under_review, approved, active, completed
	StartDate       *time.Time `json:"start_date,omitempty"`
	EndDate         *time.Time `json:"end_date,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// ── Inventory ──

type SystemReport struct {
	TotalUsers         int     `json:"total_users"`
	TotalDonations     float64 `json:"total_donations"`
	ActiveCampaigns    int     `json:"active_campaigns"`
	TotalScholarships  int     `json:"total_scholarships"`
	HousingOccupancy   int     `json:"housing_occupancy"`
	PendingEvaluations int     `json:"pending_evaluations"`
}
