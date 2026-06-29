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

func (r *ReportRepository) GetInnovationStats(ctx context.Context) (map[string]interface{}, error) {
	var totalEvents, activeEvents, totalApps, pendingEvals int
	err := r.db.QueryRow(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM innovation_events),
			(SELECT COUNT(*) FROM innovation_events WHERE status = 'open'),
			(SELECT COUNT(*) FROM project_submissions),
			(SELECT COUNT(*) FROM judging_assignments WHERE status IN ('assigned', 'in_progress'))
	`).Scan(&totalEvents, &activeEvents, &totalApps, &pendingEvals)
	if err != nil {
		return nil, fmt.Errorf("failed to get innovation stats: %w", err)
	}

	return map[string]interface{}{
		"total_events":        totalEvents,
		"active_events":       activeEvents,
		"total_applications":  totalApps,
		"pending_evaluations": pendingEvals,
	}, nil
}

func (r *ReportRepository) GetUserStats(ctx context.Context) (map[string]interface{}, error) {
	var total, active, verified int
	err := r.db.QueryRow(ctx, `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE is_active = true),
			COUNT(*) FILTER (WHERE email_verified = true)
		FROM users
	`).Scan(&total, &active, &verified)
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}

	return map[string]interface{}{
		"total_users":    total,
		"active_users":   active,
		"verified_users": verified,
	}, nil
}

func (r *ReportRepository) GetSystemOverview(ctx context.Context) (map[string]interface{}, error) {
	var totalUsers, activeCampaigns, totalScholarships, pendingEvals int
	var totalDonations float64

	err := r.db.QueryRow(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM users),
			(SELECT COALESCE(SUM(amount), 0) FROM donations),
			(SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
			(SELECT COUNT(*) FROM scholarship_applications),
			(SELECT COUNT(*) FROM judging_assignments WHERE status IN ('assigned', 'in_progress'))
	`).Scan(&totalUsers, &totalDonations, &activeCampaigns, &totalScholarships, &pendingEvals)
	
	if err != nil {
		return nil, fmt.Errorf("failed to get system overview: %w", err)
	}

	return map[string]interface{}{
		"total_users":         totalUsers,
		"total_donations":     totalDonations,
		"active_campaigns":    activeCampaigns,
		"total_scholarships":  totalScholarships,
		"pending_evaluations": pendingEvals,
	}, nil
}
