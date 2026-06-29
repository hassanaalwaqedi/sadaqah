package service

import (
	"context"

	"github.com/sadaqah/backend/internal/model"
)

// AIFinanceService handles future AI predictions and anomaly detection for the finance module
type AIFinanceService struct {
	financeService *FinanceService
}

func NewAIFinanceService(financeService *FinanceService) *AIFinanceService {
	return &AIFinanceService{
		financeService: financeService,
	}
}

// PredictBudgetConsumption runs an AI prediction model on current expenditure rates
func (s *AIFinanceService) PredictBudgetConsumption(ctx context.Context, budgetID string) (map[string]interface{}, error) {
	// Stub: In the future, this will connect to the AI model
	return map[string]interface{}{
		"prediction": "stable",
		"confidence": 0.85,
		"notes":      "Based on current run rate, budget will be exhausted in month 10",
	}, nil
}

// DetectAnomalies scans transactions for suspicious patterns
func (s *AIFinanceService) DetectAnomalies(ctx context.Context, limit int) ([]model.FinancialTransaction, error) {
	// Stub: Future anomaly detection logic goes here
	return []model.FinancialTransaction{}, nil
}
