package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type FinanceService struct {
	repo         *repository.FinanceRepository
	auditService *AuditService
	emailService *EmailService
	logger       *slog.Logger
}

func NewFinanceService(repo *repository.FinanceRepository, auditService *AuditService, emailService *EmailService, logger *slog.Logger) *FinanceService {
	return &FinanceService{
		repo:         repo,
		auditService: auditService,
		emailService: emailService,
		logger:       logger,
	}
}

// ── Financial Transactions ──

func (s *FinanceService) CreateTransaction(ctx context.Context, tx *model.FinancialTransaction, creatorID uuid.UUID) (*model.FinancialTransaction, error) {
	// Default status
	tx.Status = "draft"
	tx.TransactionDate = time.Now()
	
	if err := s.repo.CreateTransaction(ctx, tx); err != nil {
		s.logger.Error("Failed to create financial transaction", "error", err)
		return nil, err
	}

	newTxJson, _ := json.Marshal(tx)
	s.repo.LogAudit(ctx, "financial_transaction", tx.ID, "create", creatorID, nil, newTxJson, "Transaction drafted", "")

	return tx, nil
}

func (s *FinanceService) GetTransactions(ctx context.Context, limit, offset int) ([]model.FinancialTransaction, error) {
	return s.repo.GetTransactions(ctx, limit, offset)
}

func (s *FinanceService) ApproveTransaction(ctx context.Context, id, approverID uuid.UUID, isManager bool) error {
	tx, err := s.repo.GetTransactionByID(ctx, id)
	if err != nil {
		return fmt.Errorf("transaction not found: %w", err)
	}

	// Threshold Check for manager approval
	// Lira and dollar dynamics (Assuming 5000 USD equivalent requires manager)
	requiresManager := false
	if tx.Currency == "USD" && tx.Amount >= 5000 {
		requiresManager = true
	} else if tx.Currency == "TRY" && tx.Amount >= 150000 {
		requiresManager = true
	}

	if requiresManager && !isManager {
		return fmt.Errorf("this transaction requires finance_manager approval due to high amount")
	}

	oldTxJson, _ := json.Marshal(tx)
	
	tx.Status = "approved"
	tx.ApprovedBy = &approverID

	// Append to audit history
	var auditHistory []map[string]interface{}
	if len(tx.AuditHistory) > 0 {
		json.Unmarshal(tx.AuditHistory, &auditHistory)
	}
	auditHistory = append(auditHistory, map[string]interface{}{
		"action":      "approved",
		"approver_id": approverID.String(),
		"timestamp":   time.Now().Format(time.RFC3339),
	})
	newAuditJson, _ := json.Marshal(auditHistory)

	err = s.repo.UpdateTransactionStatus(ctx, id, approverID, "approved", newAuditJson)
	if err != nil {
		s.logger.Error("Failed to approve transaction", "error", err)
		return err
	}

	newTxJson, _ := json.Marshal(tx)
	s.repo.LogAudit(ctx, "financial_transaction", tx.ID, "approve", approverID, oldTxJson, newTxJson, "Transaction approved", "")

	// Check if emailService exists and notify creator
	if s.emailService != nil && tx.RecordedBy != nil {
		// Mock notify (in reality, look up email)
	}

	return nil
}

// ── Budgets ──

func (s *FinanceService) GetBudgets(ctx context.Context) ([]model.Budget, error) {
	return s.repo.GetBudgets(ctx)
}
