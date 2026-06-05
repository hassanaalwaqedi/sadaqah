package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type CoreOpsService struct {
	repo   *repository.CoreOpsRepository
	logger *slog.Logger
}

func NewCoreOpsService(repo *repository.CoreOpsRepository, logger *slog.Logger) *CoreOpsService {
	return &CoreOpsService{
		repo:   repo,
		logger: logger,
	}
}

func (s *CoreOpsService) GetCampaigns(ctx context.Context) ([]model.Campaign, error) {
	return s.repo.GetCampaigns(ctx)
}

func (s *CoreOpsService) ProcessDonation(ctx context.Context, campaignID string, donorID *string, amount float64, currency, paymentMethod, paymentRef string, isAnon bool) (*model.Donation, error) {
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
	return grant, nil
}

func (s *CoreOpsService) GetAssets(ctx context.Context) ([]model.Asset, error) {
	return s.repo.GetAssets(ctx)
}
