package model

import (
	"time"

	"github.com/google/uuid"
)

// ── Donations & Campaigns ──

type Campaign struct {
	ID            uuid.UUID `json:"id"`
	TitleEn       string    `json:"title_en"`
	TitleAr       string    `json:"title_ar"`
	Description   string    `json:"description,omitempty"`
	GoalAmount    float64   `json:"goal_amount"`
	RaisedAmount  float64   `json:"raised_amount"`
	Currency      string    `json:"currency"`
	StartDate     time.Time `json:"start_date"`
	EndDate       *time.Time `json:"end_date,omitempty"`
	Status        string    `json:"status"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type Donation struct {
	ID            uuid.UUID `json:"id"`
	CampaignID    uuid.UUID `json:"campaign_id"`
	DonorID       *uuid.UUID `json:"donor_id,omitempty"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	PaymentMethod string    `json:"payment_method"`
	PaymentRef    string    `json:"payment_ref,omitempty"`
	IsAnonymous   bool      `json:"is_anonymous"`
	Status        string    `json:"status"` // pending, completed, failed
	DonatedAt     time.Time `json:"donated_at"`
}

// ── Financial ──

type Budget struct {
	ID           uuid.UUID `json:"id"`
	NameEn       string    `json:"name_en"`
	NameAr       string    `json:"name_ar"`
	FiscalYear   string    `json:"fiscal_year"`
	TotalAmount  float64   `json:"total_amount"`
	SpentAmount  float64   `json:"spent_amount"`
	CreatedAt    time.Time `json:"created_at"`
}

type BudgetAllocation struct {
	ID              uuid.UUID `json:"id"`
	BudgetID        uuid.UUID `json:"budget_id"`
	Program         string    `json:"program"`
	AllocatedAmount float64   `json:"allocated_amount"`
	SpentAmount     float64   `json:"spent_amount"`
}

type FinancialTransaction struct {
	ID              uuid.UUID  `json:"id"`
	Type            string     `json:"type"` // income, expense, transfer
	Category        string     `json:"category"`
	Amount          float64    `json:"amount"`
	Currency        string     `json:"currency"`
	Description     string     `json:"description,omitempty"`
	ReferenceType   string     `json:"reference_type,omitempty"`
	ReferenceID     *uuid.UUID `json:"reference_id,omitempty"`
	BudgetID        *uuid.UUID `json:"budget_id,omitempty"`
	RecordedBy      *uuid.UUID `json:"recorded_by,omitempty"`
	TransactionDate time.Time  `json:"transaction_date"`
	CreatedAt       time.Time  `json:"created_at"`
}

type DonationReceipt struct {
	ID         uuid.UUID  `json:"id"`
	DonationID uuid.UUID  `json:"donation_id"`
	FileID     *uuid.UUID `json:"file_id,omitempty"`
	ReceiptNo  string     `json:"receipt_no"`
	CreatedAt  time.Time  `json:"created_at"`
}

type ExpenseRequest struct {
	ID                 uuid.UUID  `json:"id"`
	RequesterID        uuid.UUID  `json:"requester_id"`
	BudgetAllocationID *uuid.UUID `json:"budget_allocation_id,omitempty"`
	Amount             float64    `json:"amount"`
	Description        string     `json:"description"`
	Status             string     `json:"status"` // submitted, manager_approved, finance_approved, disbursed, rejected
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

type Asset struct {
	ID           uuid.UUID `json:"id"`
	AssetTag     string    `json:"asset_tag"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	PurchaseCost *float64  `json:"purchase_cost,omitempty"`
	Condition    string    `json:"condition,omitempty"` // new, good, fair, poor, decommissioned
	Location     string    `json:"location,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type SystemReport struct {
	TotalUsers         int     `json:"total_users"`
	TotalDonations     float64 `json:"total_donations"`
	ActiveCampaigns    int     `json:"active_campaigns"`
	TotalScholarships  int     `json:"total_scholarships"`
	HousingOccupancy   int     `json:"housing_occupancy"`
	PendingEvaluations int     `json:"pending_evaluations"`
}
