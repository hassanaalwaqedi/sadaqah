package service

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type DashboardService struct {
	dashboardRepo *repository.DashboardRepository
	reportRepo    *repository.ReportRepository
	logger        *slog.Logger
}

func NewDashboardService(
	dashboardRepo *repository.DashboardRepository,
	reportRepo *repository.ReportRepository,
	logger *slog.Logger,
) *DashboardService {
	return &DashboardService{
		dashboardRepo: dashboardRepo,
		reportRepo:    reportRepo,
		logger:        logger,
	}
}

func (s *DashboardService) GetDashboardData(ctx context.Context, userID uuid.UUID, roleNames []string) (*model.DashboardData, error) {
	data := &model.DashboardData{
		Alerts:     []model.DashboardAlert{},
		Activities: []model.DashboardAction{},
		MyWork: model.DashboardMyWork{
			AssignedCases: []model.AssignedCase{},
			PendingTasks:  []model.PendingTask{},
		},
	}

	isAdmin := hasRole(roleNames, "super_admin") || hasRole(roleNames, "admin")
	isScholarshipManager := hasRole(roleNames, "scholarship_manager")
	isInnovationManager := hasRole(roleNames, "innovation_manager")
	isFinanceOfficer := hasRole(roleNames, "financial_officer")
	isEvaluator := hasRole(roleNames, "judge") || hasRole(roleNames, "evaluator")
	isEmployee := hasRole(roleNames, "employee")

	// 1. Fetch My Work
	if isAdmin || isScholarshipManager || isEmployee {
		cases, err := s.dashboardRepo.GetAssignedScholarshipCases(ctx, userID)
		if err == nil {
			data.MyWork.AssignedCases = cases
		} else {
			s.logger.Error("failed to get assigned cases", slog.Any("error", err))
		}
	}

	if isAdmin || isInnovationManager || isEvaluator || isEmployee {
		evals, err := s.dashboardRepo.GetPendingEvaluations(ctx, userID)
		if err == nil {
			data.MyWork.PendingTasks = evals
		} else {
			s.logger.Error("failed to get pending evaluations", slog.Any("error", err))
		}
	}

	// 2. Fetch Summaries based on roles
	if isAdmin || isScholarshipManager {
		stats, err := s.reportRepo.GetScholarshipStats(ctx)
		if err == nil {
			data.Summary.Scholarships = &model.ScholarshipsSummary{
				Total:       toInt(stats["total_applications"]),
				Pending:     toInt(stats["pending"]),
				Approved:    toInt(stats["approved"]),
				Rejected:    toInt(stats["rejected"]),
				UnderReview: toInt(stats["total_applications"]) - toInt(stats["pending"]) - toInt(stats["approved"]) - toInt(stats["rejected"]),
			}
		}
	}

	if isAdmin || isFinanceOfficer {
		stats, err := s.reportRepo.GetFinanceStats(ctx)
		if err == nil {
			data.Summary.Finance = &model.FinanceSummary{
				TotalIncome:  toFloat(stats["total_income"]),
				TotalExpense: toFloat(stats["total_expense"]),
				NetBalance:   toFloat(stats["net_balance"]),
			}
		}
	}

	if isAdmin || isScholarshipManager || isInnovationManager {
		alerts, err := s.dashboardRepo.GetActiveAlerts(ctx)
		if err == nil {
			data.Alerts = alerts
		}

		activities, err := s.dashboardRepo.GetRecentActivities(ctx, 15)
		if err == nil {
			data.Activities = activities
		}
	}

	// 4. System Health (Super Admin only)
	if hasRole(roleNames, "super_admin") {
		data.Health = &model.DashboardHealth{
			DatabaseStatus: "Healthy",
			RedisStatus:    "Healthy",
			UptimeSeconds:  3600, // Dummy uptime for now
		}
	}

	return data, nil
}

func hasRole(roles []string, role string) bool {
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}

func toInt(v interface{}) int {
	switch val := v.(type) {
	case int:
		return val
	case int64:
		return int(val)
	case float64:
		return int(val)
	default:
		return 0
	}
}

func toFloat(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case int:
		return float64(val)
	case int64:
		return float64(val)
	default:
		return 0
	}
}
