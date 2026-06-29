package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type DashboardRepository struct {
	db *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	return &DashboardRepository{db: db}
}

func (r *DashboardRepository) GetAssignedScholarshipCases(ctx context.Context, userID uuid.UUID) ([]model.AssignedCase, error) {
	query := `
		SELECT sa.id, sc.name_ar, sa.priority, sa.status, u.email, sa.created_at
		FROM scholarship_applications sa
		JOIN scholarship_cycles sc ON sa.cycle_id = sc.id
		JOIN users u ON sa.applicant_id = u.id
		WHERE sa.assigned_to = $1 AND sa.status NOT IN ('approved', 'rejected')
		ORDER BY sa.priority DESC, sa.created_at ASC
		LIMIT 20`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get assigned cases: %w", err)
	}
	defer rows.Close()

	cases := make([]model.AssignedCase, 0)
	for rows.Next() {
		var c model.AssignedCase
		c.Type = "scholarship"
		var priority *string
		if err := rows.Scan(&c.ID, &c.Title, &priority, &c.Status, &c.Applicant, &c.CreatedAt); err != nil {
			return nil, err
		}
		if priority != nil {
			c.Priority = *priority
		} else {
			c.Priority = "normal"
		}
		cases = append(cases, c)
	}
	return cases, nil
}

func (r *DashboardRepository) GetPendingEvaluations(ctx context.Context, userID uuid.UUID) ([]model.PendingTask, error) {
	query := `
		SELECT e.id, c.name_ar, 'judging', e.status, e.assigned_at
		FROM judging_assignments e
		JOIN project_submissions a ON e.project_id = a.id
		JOIN event_categories ec ON a.category_id = ec.id
		JOIN innovation_events c ON ec.event_id = c.id
		WHERE e.judge_id = $1 AND e.status IN ('assigned', 'in_progress')
		ORDER BY e.assigned_at ASC
		LIMIT 20`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending evaluations: %w", err)
	}
	defer rows.Close()

	tasks := make([]model.PendingTask, 0)
	for rows.Next() {
		var t model.PendingTask
		t.Type = "innovation_evaluation"
		var evalType, status string
		var createdAt time.Time
		if err := rows.Scan(&t.ID, &t.Title, &evalType, &status, &createdAt); err != nil {
			return nil, err
		}
		t.Description = fmt.Sprintf("تقييم طلب (%s)", evalType)
		// We don't have a strict deadline for evaluations right now, use created_at + 7 days
		t.DueDate = createdAt.AddDate(0, 0, 7)
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (r *DashboardRepository) GetRecentActivities(ctx context.Context, limit int) ([]model.DashboardAction, error) {
	query := `
		SELECT id, 'scholarship' as module, status_to as action, title as description, user_id::text as actor, created_at
		FROM scholarship_timeline
		ORDER BY created_at DESC
		LIMIT $1`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent activities: %w", err)
	}
	defer rows.Close()

	activities := make([]model.DashboardAction, 0)
	for rows.Next() {
		var a model.DashboardAction
		var statusTo *string
		if err := rows.Scan(&a.ID, &a.Module, &statusTo, &a.Description, &a.Actor, &a.CreatedAt); err != nil {
			return nil, err
		}
		if statusTo != nil {
			a.Action = "status_changed_to_" + *statusTo
		} else {
			a.Action = "update"
		}
		activities = append(activities, a)
	}
	return activities, nil
}

func (r *DashboardRepository) GetActiveAlerts(ctx context.Context) ([]model.DashboardAlert, error) {
	// Example: Scholarship applications missing SLA
	query := `
		SELECT sa.id, 'danger' as type, 'SLA Breach' as title, 'Application ' || u.email || ' has breached SLA' as message, sa.sla_deadline as created_at
		FROM scholarship_applications sa
		JOIN users u ON sa.applicant_id = u.id
		WHERE sa.sla_deadline < NOW() AND sa.status NOT IN ('approved', 'rejected')
		LIMIT 10`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get active alerts: %w", err)
	}
	defer rows.Close()

	alerts := make([]model.DashboardAlert, 0)
	for rows.Next() {
		var a model.DashboardAlert
		if err := rows.Scan(&a.ID, &a.Type, &a.Title, &a.Message, &a.CreatedAt); err != nil {
			return nil, err
		}
		a.ActionURL = "/portal/admin/scholarships/applications/" + a.ID
		alerts = append(alerts, a)
	}
	return alerts, nil
}
