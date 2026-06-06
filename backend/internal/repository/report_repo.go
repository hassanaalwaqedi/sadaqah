package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ReportRepository struct {
	db *pgxpool.Pool
}

func NewReportRepository(db *pgxpool.Pool) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) GetScholarshipStats(ctx context.Context) (map[string]interface{}, error) {
	var total, pending, approved, rejected int
	err := r.db.QueryRow(ctx, `SELECT 
		COUNT(*), 
		COUNT(*) FILTER (WHERE status = 'pending'),
		COUNT(*) FILTER (WHERE status = 'approved'),
		COUNT(*) FILTER (WHERE status = 'rejected')
	FROM scholarship_applications`).Scan(&total, &pending, &approved, &rejected)
	if err != nil {
		return nil, fmt.Errorf("failed to get scholarship stats: %w", err)
	}

	return map[string]interface{}{
		"total_applications": total,
		"pending":            pending,
		"approved":           approved,
		"rejected":           rejected,
	}, nil
}

func (r *ReportRepository) GetHousingStats(ctx context.Context) (map[string]interface{}, error) {
	var totalUnits, availableUnits, occupiedUnits int
	err := r.db.QueryRow(ctx, `SELECT 
		COUNT(*), 
		COUNT(*) FILTER (WHERE status = 'available'),
		COUNT(*) FILTER (WHERE status = 'occupied')
	FROM housing_units`).Scan(&totalUnits, &availableUnits, &occupiedUnits)
	if err != nil {
		return nil, fmt.Errorf("failed to get housing stats: %w", err)
	}

	return map[string]interface{}{
		"total_units":     totalUnits,
		"available_units": availableUnits,
		"occupied_units":  occupiedUnits,
	}, nil
}

func (r *ReportRepository) GetDonationStats(ctx context.Context) (map[string]interface{}, error) {
	var totalDonations int
	var totalAmount float64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM donations`).Scan(&totalDonations, &totalAmount)
	if err != nil {
		return nil, fmt.Errorf("failed to get donation stats: %w", err)
	}

	return map[string]interface{}{
		"total_donations_count": totalDonations,
		"total_amount":          totalAmount,
	}, nil
}

func (r *ReportRepository) GetFinanceStats(ctx context.Context) (map[string]interface{}, error) {
	var totalIncome, totalExpense float64
	err := r.db.QueryRow(ctx, `SELECT 
		COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0),
		COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)
	FROM financial_transactions`).Scan(&totalIncome, &totalExpense)
	if err != nil {
		return nil, fmt.Errorf("failed to get finance stats: %w", err)
	}

	return map[string]interface{}{
		"total_income":  totalIncome,
		"total_expense": totalExpense,
		"net_balance":   totalIncome - totalExpense,
	}, nil
}
