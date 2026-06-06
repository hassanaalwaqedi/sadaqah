package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type CoreOpsService struct {
	repo         *repository.CoreOpsRepository
	auditService *AuditService
	emailService *EmailService
	logger       *slog.Logger
}

func NewCoreOpsService(repo *repository.CoreOpsRepository, auditService *AuditService, emailService *EmailService, logger *slog.Logger) *CoreOpsService {
	return &CoreOpsService{
		repo:         repo,
		auditService: auditService,
		emailService: emailService,
		logger:       logger,
	}
}

func (s *CoreOpsService) GetCampaigns(ctx context.Context) ([]model.Campaign, error) {
	return s.repo.GetCampaigns(ctx)
}

func (s *CoreOpsService) GetCampaignByID(ctx context.Context, id string) (*model.Campaign, error) {
	return s.repo.GetCampaignByID(ctx, id)
}

func (s *CoreOpsService) GetPublicMetrics(ctx context.Context) (int, float64, error) {
	return s.repo.GetPublicMetrics(ctx)
}

func (s *CoreOpsService) ProcessDonation(ctx context.Context, campaignID string, donorID *string, donorEmail string, amount float64, currency, paymentMethod, paymentRef string, isAnon bool) (*model.Donation, error) {
	cID, err := uuid.Parse(campaignID)
	if err != nil {
		return nil, fmt.Errorf("invalid campaign ID: %w", err)
	}

	var dID *uuid.UUID
	if donorID != nil && *donorID != "" {
		id, err := uuid.Parse(*donorID)
		if err == nil {
			dID = &id
		}
	}

	donation := &model.Donation{
		CampaignID:    cID,
		DonorID:       dID,
		Amount:        amount,
		Currency:      currency,
		PaymentMethod: paymentMethod,
		PaymentRef:    paymentRef,
		IsAnonymous:   isAnon,
	}

	if err := s.repo.ProcessDonation(ctx, donation); err != nil {
		s.logger.Error("Failed to process donation", "error", err)
		return nil, err
	}

	// Audit Log
	s.auditService.LogAction(ctx, "PROCESS_DONATION", "donation", donation.ID, nil, donation)

	// Send Email Receipt
	if s.emailService != nil && donorEmail != "" {
		// Create a mock receipt number
		receiptNo := fmt.Sprintf("RCPT-%s", strings.ToUpper(donation.ID.String()[:8]))
		s.emailService.SendDonationReceipt(donorEmail, amount, currency, receiptNo)
	}

	return donation, nil
}

func (s *CoreOpsService) GetBudgets(ctx context.Context) ([]model.Budget, error) {
	return s.repo.GetBudgets(ctx)
}

func (s *CoreOpsService) SubmitGrant(ctx context.Context, researcherID, title, abstract string, requestedBudget float64) (*model.ResearchGrant, error) {
	rID, err := uuid.Parse(researcherID)
	if err != nil {
		return nil, fmt.Errorf("invalid researcher ID: %w", err)
	}

	grant := &model.ResearchGrant{
		ResearcherID:    rID,
		Title:           title,
		Abstract:        abstract,
		RequestedBudget: requestedBudget,
	}

	if err := s.repo.SubmitGrant(ctx, grant); err != nil {
		s.logger.Error("Failed to submit research grant", "error", err)
		return nil, err
	}

	// Audit Log
	s.auditService.LogAction(ctx, "SUBMIT_GRANT", "research_grant", grant.ID, nil, grant)

	return grant, nil
}

func (s *CoreOpsService) GetAssets(ctx context.Context) ([]model.Asset, error) {
	return s.repo.GetAssets(ctx)
}

func (s *CoreOpsService) GetSystemReports(ctx context.Context) (*model.SystemReport, error) {
	return s.repo.GetSystemReports(ctx)
}

// ── Financial ──

func (s *CoreOpsService) SubmitExpenseRequest(ctx context.Context, requesterID string, amount float64, description string) (*model.ExpenseRequest, error) {
	rID, err := uuid.Parse(requesterID)
	if err != nil {
		return nil, fmt.Errorf("invalid requester ID: %w", err)
	}

	req := &model.ExpenseRequest{
		RequesterID: rID,
		Amount:      amount,
		Description: description,
	}

	if err := s.repo.SubmitExpenseRequest(ctx, req); err != nil {
		s.logger.Error("Failed to submit expense request", "error", err)
		return nil, err
	}

	s.auditService.LogAction(ctx, "SUBMIT_EXPENSE", "expense_request", req.ID, nil, req)

	return req, nil
}

func (s *CoreOpsService) DisburseExpense(ctx context.Context, expenseID, budgetAllocID, recordedBy string) error {
	if err := s.repo.DisburseExpense(ctx, expenseID, budgetAllocID, recordedBy); err != nil {
		s.logger.Error("Failed to disburse expense", "error", err)
		return err
	}

	expUUID, _ := uuid.Parse(expenseID)
	s.auditService.LogAction(ctx, "DISBURSE_EXPENSE", "expense_request", expUUID, nil, map[string]string{
		"expense_id": expenseID,
		"budget_allocation_id": budgetAllocID,
		"recorded_by": recordedBy,
	})

	return nil
}
