package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type BudgetRepository struct {
	db *pgxpool.Pool
}

func NewBudgetRepository(db *pgxpool.Pool) *BudgetRepository {
	return &BudgetRepository{db: db}
}

func (r *BudgetRepository) CreateBudget(ctx context.Context, budget *model.Budget) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Insert Budget
	query := `
		INSERT INTO budgets (
			name_ar, name_en, description, department_id, program_id, 
			fiscal_year, start_date, end_date, currency, type, status, 
			total_amount, spent_amount, reserved_amount, created_by, notes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		) RETURNING id, created_at, updated_at`
	err = tx.QueryRow(ctx, query,
		budget.NameAr, budget.NameEn, budget.Description, budget.DepartmentID, budget.ProgramID,
		budget.FiscalYear, budget.StartDate, budget.EndDate, budget.Currency, budget.Type, budget.Status,
		budget.TotalAmount, budget.SpentAmount, budget.ReservedAmount, budget.CreatedBy, budget.Notes,
	).Scan(&budget.ID, &budget.CreatedAt, &budget.UpdatedAt)
	if err != nil {
		return err
	}

	// Insert Funding Sources
	for i := range budget.FundingSources {
		fs := &budget.FundingSources[i]
		fs.BudgetID = budget.ID
		queryFS := `
			INSERT INTO budget_funding_sources (budget_id, source_type, donor_name, amount, notes)
			VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
		err = tx.QueryRow(ctx, queryFS, fs.BudgetID, fs.SourceType, fs.DonorName, fs.Amount, fs.Notes).Scan(&fs.ID, &fs.CreatedAt)
		if err != nil {
			return err
		}
	}

	// Insert Allocations
	for i := range budget.Allocations {
		a := &budget.Allocations[i]
		a.BudgetID = budget.ID
		queryAlloc := `
			INSERT INTO budget_allocations (budget_id, program, category, allocated_amount, spent_amount, notes)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`
		err = tx.QueryRow(ctx, queryAlloc, a.BudgetID, a.ModuleType, a.Category, a.AllocatedAmount, a.SpentAmount, a.Notes).Scan(&a.ID, &a.CreatedAt)
		if err != nil {
			return err
		}
	}

	// Insert Limits
	for i := range budget.Limits {
		l := &budget.Limits[i]
		l.BudgetID = budget.ID
		queryLimit := `
			INSERT INTO budget_limits (budget_id, period, max_amount, alert_threshold)
			VALUES ($1, $2, $3, $4) RETURNING id, created_at`
		err = tx.QueryRow(ctx, queryLimit, l.BudgetID, l.Period, l.MaxAmount, l.AlertThreshold).Scan(&l.ID, &l.CreatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *BudgetRepository) GetBudgetByID(ctx context.Context, id uuid.UUID) (*model.Budget, error) {
	query := `
		SELECT id, name_ar, name_en, description, department_id, program_id, fiscal_year, start_date, end_date, 
		       currency, type, status, total_amount, spent_amount, reserved_amount, created_by, approved_by, notes, created_at, updated_at
		FROM budgets WHERE id = $1`

	var b model.Budget
	err := r.db.QueryRow(ctx, query, id).Scan(
		&b.ID, &b.NameAr, &b.NameEn, &b.Description, &b.DepartmentID, &b.ProgramID, &b.FiscalYear, &b.StartDate, &b.EndDate,
		&b.Currency, &b.Type, &b.Status, &b.TotalAmount, &b.SpentAmount, &b.ReservedAmount, &b.CreatedBy, &b.ApprovedBy, &b.Notes, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Fetch related entities (Allocations, FundingSources, Limits) could be done here as needed
	// Simplified for brevity, standard SQL queries to select from related tables where budget_id = b.ID

	return &b, nil
}

func (r *BudgetRepository) ListBudgets(ctx context.Context) ([]model.Budget, error) {
	query := `
		SELECT id, name_ar, name_en, fiscal_year, currency, type, status, total_amount, spent_amount, start_date, end_date
		FROM budgets ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var budgets []model.Budget
	for rows.Next() {
		var b model.Budget
		if err := rows.Scan(&b.ID, &b.NameAr, &b.NameEn, &b.FiscalYear, &b.Currency, &b.Type, &b.Status, &b.TotalAmount, &b.SpentAmount, &b.StartDate, &b.EndDate); err != nil {
			return nil, err
		}
		budgets = append(budgets, b)
	}
	return budgets, nil
}

func (r *BudgetRepository) UpdateBudgetStatus(ctx context.Context, id uuid.UUID, status string, approverID *uuid.UUID) error {
	query := `UPDATE budgets SET status = $1, approved_by = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, approverID, id)
	return err
}

func (r *BudgetRepository) UpdateBudgetsSpentAmount(ctx context.Context, tx pgx.Tx, budgetID, allocationID uuid.UUID, amount float64) error {
	// Increment spent amount on the allocation
	if allocationID != uuid.Nil {
		queryAlloc := `UPDATE budget_allocations SET spent_amount = spent_amount + $1 WHERE id = $2`
		if _, err := tx.Exec(ctx, queryAlloc, amount, allocationID); err != nil {
			return err
		}
	}
	// Increment overall budget spent amount
	queryBudget := `UPDATE budgets SET spent_amount = spent_amount + $1 WHERE id = $2`
	_, err := tx.Exec(ctx, queryBudget, amount, budgetID)
	return err
}
