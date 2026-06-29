package service

import (
	"context"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type ResearchService struct {
	repo *repository.ResearchRepository
}

func NewResearchService(repo *repository.ResearchRepository) *ResearchService {
	return &ResearchService{repo: repo}
}

func (s *ResearchService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetDashboardStats(ctx)
}

func (s *ResearchService) GetOpenGrantPrograms(ctx context.Context) ([]model.ResearchGrantProgram, error) {
	return s.repo.GetOpenGrantPrograms(ctx)
}

func (s *ResearchService) GetRecentPublications(ctx context.Context, limit int) ([]model.ResearchPublication, error) {
	return s.repo.GetRecentPublications(ctx, limit)
}

func (s *ResearchService) GetActiveProjects(ctx context.Context, limit int) ([]model.ResearchProject, error) {
	return s.repo.GetActiveProjects(ctx, limit)
}

func (s *ResearchService) GetUpcomingConferences(ctx context.Context, limit int) ([]model.InnovationEvent, error) {
	return s.repo.GetUpcomingConferences(ctx, limit)
}
