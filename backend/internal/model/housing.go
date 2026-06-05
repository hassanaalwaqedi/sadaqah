package model

import (
	"time"

	"github.com/google/uuid"
)

type Building struct {
	ID            uuid.UUID `json:"id"`
	NameEn        string    `json:"name_en"`
	NameAr        string    `json:"name_ar"`
	Address       string    `json:"address"`
	TotalCapacity int       `json:"total_capacity"`
	Gender        string    `json:"gender"` // male, female, mixed
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
}

type Floor struct {
	ID           uuid.UUID `json:"id"`
	BuildingID   uuid.UUID `json:"building_id"`
	FloorNumber  int       `json:"floor_number"`
	Name         string    `json:"name,omitempty"`
}

type Room struct {
	ID               uuid.UUID `json:"id"`
	FloorID          uuid.UUID `json:"floor_id"`
	RoomNumber       string    `json:"room_number"`
	RoomType         string    `json:"room_type"` // single, double, etc.
	Capacity         int       `json:"capacity"`
	CurrentOccupancy int       `json:"current_occupancy"`
	MonthlyRent      float64   `json:"monthly_rent"`
	Amenities        string    `json:"amenities"` // stored as JSON string
	IsAvailable      bool      `json:"is_available"`
	CreatedAt        time.Time `json:"created_at"`
}

type HousingApplication struct {
	ID                uuid.UUID  `json:"id"`
	ApplicantID       uuid.UUID  `json:"applicant_id"`
	AcademicYear      string     `json:"academic_year"`
	Status            string     `json:"status"` // submitted, approved, rejected, allocated
	PreferredRoomType string     `json:"preferred_room_type"`
	SpecialNeeds      string     `json:"special_needs,omitempty"`
	SubmittedAt       *time.Time `json:"submitted_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type RoomAllocation struct {
	ID            uuid.UUID  `json:"id"`
	ApplicationID uuid.UUID  `json:"application_id"`
	RoomID        uuid.UUID  `json:"room_id"`
	ResidentID    uuid.UUID  `json:"resident_id"`
	LeaseStart    time.Time  `json:"lease_start"`
	LeaseEnd      time.Time  `json:"lease_end"`
	CheckInAt     *time.Time `json:"check_in_at,omitempty"`
	CheckOutAt    *time.Time `json:"check_out_at,omitempty"`
	Status        string     `json:"status"` // active, checked_out
	CreatedAt     time.Time  `json:"created_at"`
}

type RentPayment struct {
	ID             uuid.UUID  `json:"id"`
	AllocationID   uuid.UUID  `json:"allocation_id"`
	Amount         float64    `json:"amount"`
	PaymentMonth   time.Time  `json:"payment_month"`
	PaymentDate    *time.Time `json:"payment_date,omitempty"`
	Status         string     `json:"status"` // pending, paid, overdue
	PaymentMethod  string     `json:"payment_method,omitempty"`
	TransactionRef string     `json:"transaction_ref,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}
