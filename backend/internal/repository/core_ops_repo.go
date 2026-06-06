package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

type CoreOpsRepository struct {
	db *pgxpool.Pool
}

func NewCoreOpsRepository(db *pgxpool.Pool) *CoreOpsRepository {
	return &CoreOpsRepository{db: db}
}

// ── Campaigns & Donations ──

func (r *CoreOpsRepository) GetCampaigns(ctx context.Context) ([]model.Campaign, error) {
	query := `
		SELECT id, title_en, title_ar, description, goal_amount, raised_amount, currency, start_date, end_date, status, created_by, created_at
		FROM campaigns
		WHERE deleted_at IS NULL AND status = 'active'
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []model.Campaign
	for rows.Next() {
		var c model.Campaign
		if err := rows.Scan(&c.ID, &c.TitleEn, &c.TitleAr, &c.Description, &c.GoalAmount, &c.RaisedAmount, &c.Currency, &c.StartDate, &c.EndDate, &c.Status, &c.CreatedBy, &c.CreatedAt); err != nil {
			return nil, err
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, nil
}

func (r *CoreOpsRepository) GetCampaignByID(ctx context.Context, id string) (*model.Campaign, error) {
	query := `
		SELECT id, title_en, title_ar, description, goal_amount, raised_amount, currency, start_date, end_date, status, created_by, created_at
		FROM campaigns
		WHERE id = $1 AND deleted_at IS NULL AND status = 'active'
	`
	var c model.Campaign
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.TitleEn, &c.TitleAr, &c.Description, &c.GoalAmount, &c.RaisedAmount, &c.Currency, &c.StartDate, &c.EndDate, &c.Status, &c.CreatedBy, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaign by id: %w", err)
	}
	return &c, nil
}

func (r *CoreOpsRepository) GetPublicMetrics(ctx context.Context) (int, float64, error) {
	var studentCount int
	var totalDonations float64

	err := r.db.QueryRow(ctx, "SELECT COUNT(id) FROM users WHERE is_active = true").Scan(&studentCount)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to count students: %w", err)
	}

	err = r.db.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'completed'").Scan(&totalDonations)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to sum donations: %w", err)
	}

	return studentCount, totalDonations, nil
}

func (r *CoreOpsRepository) ProcessDonation(ctx context.Context, d *model.Donation) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Record donation
	query := `
		INSERT INTO donations (campaign_id, donor_id, amount, currency, payment_method, payment_ref, is_anonymous, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
		RETURNING id, donated_at
	`
	err = tx.QueryRow(ctx, query, d.CampaignID, d.DonorID, d.Amount, d.Currency, d.PaymentMethod, d.PaymentRef, d.IsAnonymous).Scan(&d.ID, &d.DonatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert donation: %w", err)
	}

	// Generate Donation Receipt
	receiptNo := fmt.Sprintf("RCPT-%s", d.ID.String()[:8])
	_, err = tx.Exec(ctx, `INSERT INTO donation_receipts (donation_id, receipt_no) VALUES ($1, $2)`, d.ID, receiptNo)
	if err != nil {
		return fmt.Errorf("failed to insert donation receipt: %w", err)
	}

	// Record Financial Transaction (Income)
	_, err = tx.Exec(ctx, `
		INSERT INTO financial_transactions (type, category, amount, currency, reference_type, reference_id, transaction_date)
		VALUES ('income', 'donation', $1, $2, 'donation', $3, CURRENT_DATE)
	`, d.Amount, d.Currency, d.ID)
	if err != nil {
		return fmt.Errorf("failed to insert financial transaction: %w", err)
	}

	// Update campaign raised amount
	_, err = tx.Exec(ctx, `UPDATE campaigns SET raised_amount = raised_amount + $1 WHERE id = $2`, d.Amount, d.CampaignID)
	if err != nil {
		return fmt.Errorf("failed to update campaign: %w", err)
	}

	return tx.Commit(ctx)
}

// ── Financial ──

func (r *CoreOpsRepository) GetBudgets(ctx context.Context) ([]model.Budget, error) {
	query := `SELECT id, name_en, name_ar, fiscal_year, total_amount, spent_amount, created_at FROM budgets ORDER BY fiscal_year DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch budgets: %w", err)
	}
	defer rows.Close()

	var budgets []model.Budget
	for rows.Next() {
		var b model.Budget
		if err := rows.Scan(&b.ID, &b.NameEn, &b.NameAr, &b.FiscalYear, &b.TotalAmount, &b.SpentAmount, &b.CreatedAt); err != nil {
			return nil, err
		}
		budgets = append(budgets, b)
	}
	return budgets, nil
}

func (r *CoreOpsRepository) SubmitExpenseRequest(ctx context.Context, req *model.ExpenseRequest) error {
	query := `
		INSERT INTO expense_requests (requester_id, amount, description, status)
		VALUES ($1, $2, $3, 'submitted')
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query, req.RequesterID, req.Amount, req.Description).Scan(&req.ID, &req.CreatedAt, &req.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert expense request: %w", err)
	}
	req.Status = "submitted"
	return nil
}

func (r *CoreOpsRepository) DisburseExpense(ctx context.Context, expenseID string, budgetAllocID string, recordedBy string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Fetch current expense request
	var amount float64
	var status string
	err = tx.QueryRow(ctx, `SELECT amount, status FROM expense_requests WHERE id = $1 FOR UPDATE`, expenseID).Scan(&amount, &status)
	if err != nil {
		return fmt.Errorf("failed to lock expense request: %w", err)
	}

	if status == "disbursed" {
		return fmt.Errorf("expense already disbursed")
	}

	// Update expense request
	_, err = tx.Exec(ctx, `UPDATE expense_requests SET status = 'disbursed', budget_allocation_id = $1, updated_at = NOW() WHERE id = $2`, budgetAllocID, expenseID)
	if err != nil {
		return fmt.Errorf("failed to update expense request status: %w", err)
	}

	// Deduct from Budget Allocation
	var budgetID string
	err = tx.QueryRow(ctx, `UPDATE budget_allocations SET spent_amount = spent_amount + $1 WHERE id = $2 RETURNING budget_id`, amount, budgetAllocID).Scan(&budgetID)
	if err != nil {
		return fmt.Errorf("failed to update budget allocation: %w", err)
	}

	// Deduct from Parent Budget
	_, err = tx.Exec(ctx, `UPDATE budgets SET spent_amount = spent_amount + $1 WHERE id = $2`, amount, budgetID)
	if err != nil {
		return fmt.Errorf("failed to update parent budget: %w", err)
	}

	// Record Financial Transaction (Expense)
	_, err = tx.Exec(ctx, `
		INSERT INTO financial_transactions (type, category, amount, currency, reference_type, reference_id, budget_id, recorded_by, transaction_date)
		VALUES ('expense', 'grant_disbursement', $1, 'USD', 'expense_request', $2, $3, $4, CURRENT_DATE)
	`, amount, expenseID, budgetID, recordedBy)
	if err != nil {
		return fmt.Errorf("failed to insert financial transaction for expense: %w", err)
	}

	return tx.Commit(ctx)
}

// ── Research ──

func (r *CoreOpsRepository) SubmitGrant(ctx context.Context, g *model.ResearchGrant) error {
	query := `
		INSERT INTO research_grants (researcher_id, title, abstract, requested_budget, status)
		VALUES ($1, $2, $3, $4, 'under_review')
		RETURNING id, created_at
	`
	return r.db.QueryRow(ctx, query, g.ResearcherID, g.Title, g.Abstract, g.RequestedBudget).Scan(&g.ID, &g.CreatedAt)
}

// ── Inventory ──

func (r *CoreOpsRepository) GetAssets(ctx context.Context) ([]model.Asset, error) {
	query := `SELECT id, asset_tag, name, description, purchase_cost, condition, location, created_at FROM assets WHERE deleted_at IS NULL`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch assets: %w", err)
	}
	defer rows.Close()

	var assets []model.Asset
	for rows.Next() {
		var a model.Asset
		if err := rows.Scan(&a.ID, &a.AssetTag, &a.Name, &a.Description, &a.PurchaseCost, &a.Condition, &a.Location, &a.CreatedAt); err != nil {
			return nil, err
		}
		assets = append(assets, a)
	}
	return assets, nil
}

func (r *CoreOpsRepository) GetSystemReports(ctx context.Context) (*model.SystemReport, error) {
	var report model.SystemReport

	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&report.TotalUsers)
	if err != nil { return nil, err }

	var totalDonations *float64
	err = r.db.QueryRow(ctx, `SELECT SUM(amount) FROM donations WHERE status = 'completed'`).Scan(&totalDonations)
	if err != nil { return nil, err }
	if totalDonations != nil {
		report.TotalDonations = *totalDonations
	}

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM campaigns WHERE status = 'active'`).Scan(&report.ActiveCampaigns)
	if err != nil { return nil, err }

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM scholarship_applications`).Scan(&report.TotalScholarships)
	if err != nil { return nil, err }

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM housing_units WHERE status = 'occupied'`).Scan(&report.HousingOccupancy)
	if err != nil { return nil, err }

	err = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM evaluations WHERE status = 'pending'`).Scan(&report.PendingEvaluations)
	if err != nil { return nil, err }

	return &report, nil
}
