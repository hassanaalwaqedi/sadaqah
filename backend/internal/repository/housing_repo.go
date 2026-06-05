package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

type HousingRepository struct {
	db *pgxpool.Pool
}

func NewHousingRepository(db *pgxpool.Pool) *HousingRepository {
	return &HousingRepository{db: db}
}

// ── Rooms & Buildings ──

func (r *HousingRepository) GetBuildings(ctx context.Context) ([]model.Building, error) {
	query := `SELECT id, name_en, name_ar, address, total_capacity, gender, is_active, created_at FROM buildings ORDER BY name_en ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch buildings: %w", err)
	}
	defer rows.Close()

	var buildings []model.Building
	for rows.Next() {
		var b model.Building
		if err := rows.Scan(&b.ID, &b.NameEn, &b.NameAr, &b.Address, &b.TotalCapacity, &b.Gender, &b.IsActive, &b.CreatedAt); err != nil {
			return nil, err
		}
		buildings = append(buildings, b)
	}
	return buildings, nil
}

func (r *HousingRepository) GetRoomsByBuilding(ctx context.Context, buildingID uuid.UUID) ([]model.Room, error) {
	query := `
		SELECT r.id, r.floor_id, r.room_number, r.room_type, r.capacity, r.current_occupancy, r.monthly_rent, r.is_available, r.created_at
		FROM rooms r
		JOIN floors f ON r.floor_id = f.id
		WHERE f.building_id = $1
		ORDER BY r.room_number ASC
	`
	rows, err := r.db.Query(ctx, query, buildingID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch rooms: %w", err)
	}
	defer rows.Close()

	var rooms []model.Room
	for rows.Next() {
		var rm model.Room
		if err := rows.Scan(&rm.ID, &rm.FloorID, &rm.RoomNumber, &rm.RoomType, &rm.Capacity, &rm.CurrentOccupancy, &rm.MonthlyRent, &rm.IsAvailable, &rm.CreatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, rm)
	}
	return rooms, nil
}

// ── Applications & Allocations ──

func (r *HousingRepository) AllocateRoom(ctx context.Context, appID, roomID, residentID uuid.UUID, leaseStart, leaseEnd string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update room occupancy
	_, err = tx.Exec(ctx, `UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = $1`, roomID)
	if err != nil {
		return err
	}

	// Create allocation
	_, err = tx.Exec(ctx, `
		INSERT INTO room_allocations (application_id, room_id, resident_id, lease_start, lease_end, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
	`, appID, roomID, residentID, leaseStart, leaseEnd)
	if err != nil {
		return err
	}

	// Update application status
	_, err = tx.Exec(ctx, `UPDATE housing_applications SET status = 'allocated' WHERE id = $1`, appID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ── Invoices ──

func (r *HousingRepository) GenerateMonthlyRentInvoices(ctx context.Context) (int, error) {
	query := `
		INSERT INTO rent_payments (allocation_id, amount, payment_month, status)
		SELECT 
			ra.id, 
			r.monthly_rent, 
			date_trunc('month', CURRENT_DATE), 
			'pending'
		FROM room_allocations ra
		JOIN rooms r ON ra.room_id = r.id
		WHERE ra.status = 'active'
		AND NOT EXISTS (
			SELECT 1 FROM rent_payments rp 
			WHERE rp.allocation_id = ra.id 
			AND rp.payment_month = date_trunc('month', CURRENT_DATE)
		)
	`
	cmd, err := r.db.Exec(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to generate rent invoices: %w", err)
	}

	return int(cmd.RowsAffected()), nil
}

func (r *HousingRepository) GetPendingInvoices(ctx context.Context, residentID uuid.UUID) ([]model.RentPayment, error) {
	query := `
		SELECT p.id, p.allocation_id, p.amount, p.payment_month, p.status, p.created_at
		FROM rent_payments p
		JOIN room_allocations a ON p.allocation_id = a.id
		WHERE a.resident_id = $1 AND p.status = 'pending'
		ORDER BY p.payment_month ASC
	`
	rows, err := r.db.Query(ctx, query, residentID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch pending invoices: %w", err)
	}
	defer rows.Close()

	var invoices []model.RentPayment
	for rows.Next() {
		var inv model.RentPayment
		if err := rows.Scan(&inv.ID, &inv.AllocationID, &inv.Amount, &inv.PaymentMonth, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		invoices = append(invoices, inv)
	}
	return invoices, nil
}
