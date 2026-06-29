package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type BudgetService struct {
	repo          *repository.BudgetRepository
	auditRepo     *repository.AuditRepository // Assuming we have an audit repo or we can pass it
	financeRepo   *repository.FinanceRepository
}

func NewBudgetService(repo *repository.BudgetRepository, financeRepo *repository.FinanceRepository) *BudgetService {
	return &BudgetService{
		repo:        repo,
		financeRepo: financeRepo,
	}
}

func (s *BudgetService) CreateBudget(ctx context.Context, budget *model.Budget, userID uuid.UUID) error {
	budget.CreatedBy = &userID
	budget.Status = "draft" // Initial state

	// Calculate total amount from allocations if not provided
	if budget.TotalAmount == 0 && len(budget.Allocations) > 0 {
		var total float64
		for _, a := range budget.Allocations {
			total += a.AllocatedAmount
		}
		budget.TotalAmount = total
	}

	return s.repo.CreateBudget(ctx, budget)
}

func (s *BudgetService) GetBudget(ctx context.Context, id uuid.UUID) (*model.Budget, error) {
	return s.repo.GetBudgetByID(ctx, id)
}

func (s *BudgetService) ListBudgets(ctx context.Context) ([]model.Budget, error) {
	return s.repo.ListBudgets(ctx)
}

func (s *BudgetService) ApproveBudget(ctx context.Context, id uuid.UUID, approverID uuid.UUID) error {
	b, err := s.repo.GetBudgetByID(ctx, id)
	if err != nil {
		return err
	}
	if b == nil {
		return errors.New("budget not found")
	}

	if b.Status != "draft" && b.Status != "pending_approval" {
		return errors.New("budget cannot be approved from current status")
	}

	return s.repo.UpdateBudgetStatus(ctx, id, "approved", &approverID)
}

// TransactionHook is called when an expense transaction is approved to deduct from the budget
func (s *BudgetService) HandleTransactionApproved(ctx context.Context, txID uuid.UUID) error {
	// 1. Fetch transaction
	// 2. Extract BudgetID and AllocationID
	// 3. Update the budget's spent amount
	// 4. Check thresholds and alert
	return nil
}
