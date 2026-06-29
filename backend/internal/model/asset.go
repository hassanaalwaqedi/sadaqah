package model

import (
	"time"

	"github.com/google/uuid"
)

type AssetCategory struct {
	ID          uuid.UUID      `json:"id"`
	NameEn      string         `json:"name_en"`
	NameAr      string         `json:"name_ar"`
	Description *string        `json:"description,omitempty"`
	ParentID    *uuid.UUID     `json:"parent_id,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type Location struct {
	ID        uuid.UUID `json:"id"`
	NameEn    string    `json:"name_en"`
	NameAr    string    `json:"name_ar"`
	Address   *string   `json:"address,omitempty"`
	Type      string    `json:"type"` // Head Office, Warehouse, Housing
	Capacity  *int      `json:"capacity,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Asset struct {
	ID              uuid.UUID  `json:"id"`
	AssetNumber     string     `json:"asset_number"`
	Barcode         *string    `json:"barcode,omitempty"`
	QRCode          *string    `json:"qr_code,omitempty"`
	NameEn          string     `json:"name_en"`
	NameAr          string     `json:"name_ar"`
	CategoryID      uuid.UUID  `json:"category_id"`
	Category        *AssetCategory `json:"category,omitempty"` // For joins
	Brand           *string    `json:"brand,omitempty"`
	Model           *string    `json:"model,omitempty"`
	SerialNumber    *string    `json:"serial_number,omitempty"`
	PurchaseDate    *time.Time `json:"purchase_date,omitempty"`
	PurchaseCost    *float64   `json:"purchase_cost,omitempty"`
	Supplier        *string    `json:"supplier,omitempty"`
	WarrantyExpiry  *time.Time `json:"warranty_expiry,omitempty"`
	LocationID      *uuid.UUID `json:"location_id,omitempty"`
	Location        *Location  `json:"location,omitempty"` // For joins
	Department      *string    `json:"department,omitempty"`
	AssignedTo      *uuid.UUID `json:"assigned_to,omitempty"`
	AssignedUser    *User      `json:"assigned_user,omitempty"` // For joins
	Status          string     `json:"status"` // available, assigned, maintenance, disposed, donated
	UsefulLifeYears *int       `json:"useful_life_years,omitempty"`
	CurrentValue    *float64   `json:"current_value,omitempty"`
	IsDonated       bool       `json:"is_donated"`
	DonorName       *string    `json:"donor_name,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type AssetAssignment struct {
	ID           uuid.UUID  `json:"id"`
	AssetID      uuid.UUID  `json:"asset_id"`
	AssignedTo   uuid.UUID  `json:"assigned_to"`
	AssignedUser *User      `json:"assigned_user,omitempty"`
	AssignedBy   *uuid.UUID `json:"assigned_by,omitempty"`
	AssignedAt   time.Time  `json:"assigned_at"`
	ReturnedAt   *time.Time `json:"returned_at,omitempty"`
	ConditionOut *string    `json:"condition_out,omitempty"`
	ConditionIn  *string    `json:"condition_in,omitempty"`
	Notes        *string    `json:"notes,omitempty"`
}

type MaintenanceRecord struct {
	ID            uuid.UUID  `json:"id"`
	AssetID       uuid.UUID  `json:"asset_id"`
	Type          string     `json:"type"` // preventive, corrective
	Description   string     `json:"description"`
	ScheduledDate *time.Time `json:"scheduled_date,omitempty"`
	CompletedDate *time.Time `json:"completed_date,omitempty"`
	Cost          *float64   `json:"cost,omitempty"`
	PerformedBy   *string    `json:"performed_by,omitempty"`
	Status        string     `json:"status"` // scheduled, in_progress, completed, cancelled
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type AssetDocument struct {
	ID         uuid.UUID  `json:"id"`
	AssetID    uuid.UUID  `json:"asset_id"`
	Type       string     `json:"type"` // invoice, warranty, manual, photo
	FileURL    string     `json:"file_url"`
	UploadedAt time.Time  `json:"uploaded_at"`
	UploadedBy *uuid.UUID `json:"uploaded_by,omitempty"`
}
