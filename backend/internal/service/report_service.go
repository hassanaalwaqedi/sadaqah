package service

import (
	"context"
	"log/slog"

	"github.com/sadaqah/backend/internal/repository"
)

type ReportService struct {
	repo   *repository.ReportRepository
	logger *slog.Logger
}

func NewReportService(repo *repository.ReportRepository, logger *slog.Logger) *ReportService {
	return &ReportService{
		repo:   repo,
		logger: logger,
	}
}

func (s *ReportService) GetScholarshipStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetScholarshipStats(ctx)
}

func (s *ReportService) GetDonationStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetDonationStats(ctx)
}

func (s *ReportService) GetFinanceStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetFinanceStats(ctx)
}

func (s *ReportService) GetInnovationStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetInnovationStats(ctx)
}

func (s *ReportService) GetUserStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetUserStats(ctx)
}

func (s *ReportService) GetSystemOverview(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetSystemOverview(ctx)
}

