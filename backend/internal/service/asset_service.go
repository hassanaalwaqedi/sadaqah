package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type AssetService struct {
	repo   *repository.AssetRepository
	logger *slog.Logger
}

func NewAssetService(repo *repository.AssetRepository, logger *slog.Logger) *AssetService {
	return &AssetService{repo: repo, logger: logger}
}

func (s *AssetService) CreateAsset(ctx context.Context, asset *model.Asset) error {
	// Generate UUID if not present
	if asset.ID == uuid.Nil {
		asset.ID = uuid.New()
	}

	// Default status
	if asset.Status == "" {
		asset.Status = "available"
	}

	// Generate QR Code content if none provided
	if asset.QRCode == nil || *asset.QRCode == "" {
		qr := fmt.Sprintf("ASSET-%s", asset.ID.String())
		asset.QRCode = &qr
	}

	err := s.repo.CreateAsset(ctx, asset)
	if err != nil {
		s.logger.Error("Failed to create asset", "error", err)
		return err
	}

	return nil
}

func (s *AssetService) GetAssets(ctx context.Context) ([]model.Asset, error) {
	return s.repo.GetAssets(ctx)
}

func (s *AssetService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetDashboardStats(ctx)
}
