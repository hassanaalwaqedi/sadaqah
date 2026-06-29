package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type FinanceRepository struct {
	db *pgxpool.Pool
}

func NewFinanceRepository(db *pgxpool.Pool) *FinanceRepository {
	return &FinanceRepository{db: db}
}

// Transaction operations
func (r *FinanceRepository) CreateTransaction(ctx context.Context, tx *model.FinancialTransaction) error {
	query := `
		INSERT INTO financial_transactions (
			type, category, amount, currency, description, reference_type, reference_id,
			budget_id, recorded_by, transaction_date, status, source, destination,
			receipt_file_id, invoice_file_id, notes, audit_history
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
		) RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(ctx, query,
		tx.Type, tx.Category, tx.Amount, tx.Currency, tx.Description, tx.ReferenceType, tx.ReferenceID,
		tx.BudgetID, tx.RecordedBy, tx.TransactionDate, tx.Status, tx.Source, tx.Destination,
		tx.ReceiptFileID, tx.InvoiceFileID, tx.Notes, tx.AuditHistory,
	).Scan(&tx.ID, &tx.CreatedAt, &tx.UpdatedAt)
}

func (r *FinanceRepository) GetTransactions(ctx context.Context, limit, offset int) ([]model.FinancialTransaction, error) {
	query := `
		SELECT 
			id, type, category, amount, currency, description, reference_type, reference_id,
			budget_id, recorded_by, transaction_date, status, source, destination,
			receipt_file_id, invoice_file_id, approved_by, notes, audit_history, created_at, updated_at
		FROM financial_transactions
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []model.FinancialTransaction
	for rows.Next() {
		var tx model.FinancialTransaction
		err := rows.Scan(
			&tx.ID, &tx.Type, &tx.Category, &tx.Amount, &tx.Currency, &tx.Description,
			&tx.ReferenceType, &tx.ReferenceID, &tx.BudgetID, &tx.RecordedBy, &tx.TransactionDate,
			&tx.Status, &tx.Source, &tx.Destination, &tx.ReceiptFileID, &tx.InvoiceFileID,
			&tx.ApprovedBy, &tx.Notes, &tx.AuditHistory, &tx.CreatedAt, &tx.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		txs = append(txs, tx)
	}
	return txs, nil
}

func (r *FinanceRepository) GetTransactionByID(ctx context.Context, id uuid.UUID) (*model.FinancialTransaction, error) {
	query := `
		SELECT 
			id, type, category, amount, currency, description, reference_type, reference_id,
			budget_id, recorded_by, transaction_date, status, source, destination,
			receipt_file_id, invoice_file_id, approved_by, notes, audit_history, created_at, updated_at
		FROM financial_transactions
		WHERE id = $1
	`
	var tx model.FinancialTransaction
	err := r.db.QueryRow(ctx, query, id).Scan(
		&tx.ID, &tx.Type, &tx.Category, &tx.Amount, &tx.Currency, &tx.Description,
		&tx.ReferenceType, &tx.ReferenceID, &tx.BudgetID, &tx.RecordedBy, &tx.TransactionDate,
		&tx.Status, &tx.Source, &tx.Destination, &tx.ReceiptFileID, &tx.InvoiceFileID,
		&tx.ApprovedBy, &tx.Notes, &tx.AuditHistory, &tx.CreatedAt, &tx.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *FinanceRepository) UpdateTransactionStatus(ctx context.Context, id, approverID uuid.UUID, status string, auditHistory []byte) error {
	query := `
		UPDATE financial_transactions
		SET status = $1, approved_by = $2, audit_history = $3, updated_at = NOW()
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, status, approverID, auditHistory, id)
	return err
}

func (r *FinanceRepository) GetBudgets(ctx context.Context) ([]model.Budget, error) {
	query := `SELECT id, name_en, name_ar, fiscal_year, total_amount, spent_amount, created_at FROM budgets ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
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

func (r *FinanceRepository) LogAudit(ctx context.Context, entityType string, entityID uuid.UUID, action string, actorID uuid.UUID, oldValues, newValues []byte, reason string, ipAddress string) error {
	query := `
		INSERT INTO finance_audit_logs (
			entity_type, entity_id, action, actor_id, old_values, new_values, reason, ip_address
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.Exec(ctx, query, entityType, entityID, action, actorID, oldValues, newValues, reason, ipAddress)
	return err
}
