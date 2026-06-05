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
