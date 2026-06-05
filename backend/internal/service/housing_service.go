package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type HousingService struct {
	repo   *repository.HousingRepository
	logger *slog.Logger
}

func NewHousingService(repo *repository.HousingRepository, logger *slog.Logger) *HousingService {
	return &HousingService{
		repo:   repo,
		logger: logger,
	}
}

func (s *HousingService) GetBuildings(ctx context.Context) ([]model.Building, error) {
	return s.repo.GetBuildings(ctx)
}

func (s *HousingService) GetRoomsByBuilding(ctx context.Context, buildingID string) ([]model.Room, error) {
	bID, err := uuid.Parse(buildingID)
	if err != nil {
		return nil, fmt.Errorf("invalid building ID: %w", err)
	}
	return s.repo.GetRoomsByBuilding(ctx, bID)
}

func (s *HousingService) AllocateRoom(ctx context.Context, appID, roomID, residentID string, leaseStart, leaseEnd string) error {
	aID, err := uuid.Parse(appID)
	if err != nil {
		return fmt.Errorf("invalid application ID: %w", err)
	}
	rID, err := uuid.Parse(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}
	resID, err := uuid.Parse(residentID)
	if err != nil {
		return fmt.Errorf("invalid resident ID: %w", err)
	}

	err = s.repo.AllocateRoom(ctx, aID, rID, resID, leaseStart, leaseEnd)
	if err != nil {
		s.logger.Error("Failed to allocate room", "error", err, "appID", appID)
		return err
	}
	s.logger.Info("Successfully allocated room", "appID", appID, "roomID", roomID)
	return nil
}

func (s *HousingService) GetPendingInvoices(ctx context.Context, residentID string) ([]model.RentPayment, error) {
	rID, err := uuid.Parse(residentID)
	if err != nil {
		return nil, fmt.Errorf("invalid resident ID: %w", err)
	}
	return s.repo.GetPendingInvoices(ctx, rID)
}

// ── Cron Jobs ──

func (s *HousingService) StartRentInvoiceCron() {
	s.logger.Info("Starting Rent Invoice Cron Job")
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for {
			<-ticker.C
			// Only run on the 1st of the month
			if time.Now().Day() == 1 {
				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
				count, err := s.repo.GenerateMonthlyRentInvoices(ctx)
				if err != nil {
					s.logger.Error("Cron: Failed to generate monthly rent invoices", "error", err)
				} else {
					s.logger.Info("Cron: Successfully generated monthly rent invoices", "count", count)
				}
				cancel()
			}
		}
	}()
}
