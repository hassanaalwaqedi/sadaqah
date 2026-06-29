package model

import (
	"time"

	"github.com/google/uuid"
)

type Campaign struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	TitleEn       string     `json:"title_en" db:"title_en"`
	TitleAr       string     `json:"title_ar" db:"title_ar"`
	Description   string     `json:"description,omitempty" db:"description"`
	GoalAmount    float64    `json:"goal_amount" db:"goal_amount"`
	RaisedAmount  float64    `json:"raised_amount" db:"raised_amount"`
	Currency      string     `json:"currency" db:"currency"`
	StartDate     time.Time  `json:"start_date" db:"start_date"`
	EndDate       *time.Time `json:"end_date,omitempty" db:"end_date"`
	Status        string     `json:"status" db:"status"`
	Category      string     `json:"category" db:"category"`
	Visibility    string     `json:"visibility" db:"visibility"`
	Priority      string     `json:"priority" db:"priority"`
	CoverImageID  *uuid.UUID `json:"cover_image_file_id,omitempty" db:"cover_image_file_id"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Donation struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	CampaignID       uuid.UUID  `json:"campaign_id" db:"campaign_id"`
	DonorID          *uuid.UUID `json:"donor_id,omitempty" db:"donor_id"`
	Amount           float64    `json:"amount" db:"amount"`
	Currency         string     `json:"currency" db:"currency"`
	PaymentMethod    string     `json:"payment_method" db:"payment_method"`
	PaymentRef       string     `json:"payment_ref,omitempty" db:"payment_ref"`
	IsAnonymous      bool       `json:"is_anonymous" db:"is_anonymous"`
	IsRecurring      bool       `json:"is_recurring" db:"is_recurring"`
	RecurringSchedID *uuid.UUID `json:"recurring_schedule_id,omitempty" db:"recurring_schedule_id"`
	Status           string     `json:"status" db:"status"` // draft, waiting_transfer, pending_verification, need_info, approved, rejected, completed, failed, refunded, archived
	DonationType     string     `json:"donation_type" db:"donation_type"` // Sadaqah, Zakat, etc.
	AllocationStatus string     `json:"allocation_status" db:"allocation_status"` // pending, allocated
	RestrictedFundID *uuid.UUID `json:"restricted_fund_id,omitempty" db:"restricted_fund_id"`
	Notes            string     `json:"notes,omitempty" db:"notes"`
	ReferenceNumber  string     `json:"reference_number,omitempty" db:"reference_number"`
	ReceiptFileObj   string     `json:"receipt_file_obj,omitempty" db:"receipt_file_obj"`
	TransferDate     *time.Time `json:"transfer_date,omitempty" db:"transfer_date"`
	BankName         string     `json:"bank_name,omitempty" db:"bank_name"`
	FinanceNotes     string     `json:"finance_notes,omitempty" db:"finance_notes"`
	DonatedAt        time.Time  `json:"donated_at" db:"donated_at"`
}

type UploadReceiptRequest struct {
	ReceiptFileObj string    `json:"receipt_file_obj" validate:"required"`
	TransferDate   time.Time `json:"transfer_date" validate:"required"`
	BankName       string    `json:"bank_name" validate:"required"`
	PaymentRef     string    `json:"payment_ref"`
}

type VerifyDonationRequest struct {
	Status       string `json:"status" validate:"required"` // approved, rejected, need_info
	FinanceNotes string `json:"finance_notes"`
}

type RecurringDonationSchedule struct {
	ID          uuid.UUID `json:"id" db:"id"`
	DonorID     uuid.UUID `json:"donor_id" db:"donor_id"`
	CampaignID  uuid.UUID `json:"campaign_id" db:"campaign_id"`
	Amount      float64   `json:"amount" db:"amount"`
	Currency    string    `json:"currency" db:"currency"`
	Frequency   string    `json:"frequency" db:"frequency"` // monthly, quarterly, annually
	NextRunAt   time.Time `json:"next_run_at" db:"next_run_at"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type DonationAllocation struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	DonationID         uuid.UUID  `json:"donation_id" db:"donation_id"`
	BudgetAllocationID *uuid.UUID `json:"budget_allocation_id,omitempty" db:"budget_allocation_id"`
	Amount             float64    `json:"amount" db:"amount"`
	Program            string     `json:"program" db:"program"`
	Status             string     `json:"status" db:"status"`
	Notes              string     `json:"notes" db:"notes"`
	AllocatedBy        *uuid.UUID `json:"allocated_by,omitempty" db:"allocated_by"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
}

type ImpactUpdate struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Program     string     `json:"program" db:"program"`
	TitleEn     string     `json:"title_en" db:"title_en"`
	TitleAr     string     `json:"title_ar" db:"title_ar"`
	ContentEn   string     `json:"content_en" db:"content_en"`
	ContentAr   string     `json:"content_ar" db:"content_ar"`
	PublishedBy *uuid.UUID `json:"published_by,omitempty" db:"published_by"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

type DonorImpactSummary struct {
	TotalDonated       float64              `json:"total_donated"`
	TotalAllocated     float64              `json:"total_allocated"`
	ProgramsSupported  []string             `json:"programs_supported"`
	RecentAllocations  []DonationAllocation `json:"recent_allocations"`
	ImpactUpdates      []ImpactUpdate       `json:"impact_updates"`
	CampaignsSupported int                  `json:"campaigns_supported"`
}

type ImpactMetric struct {
	ID           uuid.UUID `json:"id" db:"id"`
	CampaignID   uuid.UUID `json:"campaign_id" db:"campaign_id"`
	MetricNameEn string    `json:"metric_name_en" db:"metric_name_en"`
	MetricNameAr string    `json:"metric_name_ar" db:"metric_name_ar"`
	TargetValue  float64   `json:"target_value" db:"target_value"`
	CurrentValue float64   `json:"current_value" db:"current_value"`
	Unit         string    `json:"unit" db:"unit"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}
