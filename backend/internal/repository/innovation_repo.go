package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

type InnovationRepository struct {
	db *pgxpool.Pool
}

func NewInnovationRepository(db *pgxpool.Pool) *InnovationRepository {
	return &InnovationRepository{db: db}
}

// ── Events ──

func (r *InnovationRepository) CreateEvent(ctx context.Context, e *model.InnovationEvent) error {
	query := `
		INSERT INTO innovation_events (name_en, name_ar, description, event_date, submission_deadline, status, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`
	return r.db.QueryRow(ctx, query, e.NameEn, e.NameAr, e.Description, e.EventDate, e.SubmissionDeadline, e.Status, e.CreatedBy).Scan(&e.ID, &e.CreatedAt)
}

func (r *InnovationRepository) GetActiveEvents(ctx context.Context) ([]model.InnovationEvent, error) {
	query := `SELECT id, name_en, name_ar, description, event_date, submission_deadline, status, created_by, created_at 
			  FROM innovation_events WHERE deleted_at IS NULL AND status != 'draft' ORDER BY submission_deadline ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch events: %w", err)
	}
	defer rows.Close()

	var events []model.InnovationEvent
	for rows.Next() {
		var e model.InnovationEvent
		if err := rows.Scan(&e.ID, &e.NameEn, &e.NameAr, &e.Description, &e.EventDate, &e.SubmissionDeadline, &e.Status, &e.CreatedBy, &e.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

// ── Submissions ──

func (r *InnovationRepository) SubmitProject(ctx context.Context, p *model.ProjectSubmission) error {
	query := `
		INSERT INTO project_submissions (category_id, submitter_id, title, abstract, description, status, submitted_at)
		VALUES ($1, $2, $3, $4, $5, 'submitted', $6)
		RETURNING id, created_at
	`
	now := time.Now()
	return r.db.QueryRow(ctx, query, p.CategoryID, p.SubmitterID, p.Title, p.Abstract, p.Description, now).Scan(&p.ID, &p.CreatedAt)
}

// ── Judging ──

func (r *InnovationRepository) GetJudgingAssignments(ctx context.Context, judgeID uuid.UUID) ([]model.ProjectSubmission, error) {
	query := `
		SELECT p.id, p.category_id, p.submitter_id, p.title, p.abstract, p.status, p.created_at
		FROM judging_assignments j
		JOIN project_submissions p ON j.project_id = p.id
		WHERE j.judge_id = $1 AND j.status != 'completed' AND p.deleted_at IS NULL
	`
	rows, err := r.db.Query(ctx, query, judgeID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch judging assignments: %w", err)
	}
	defer rows.Close()

	var projects []model.ProjectSubmission
	for rows.Next() {
		var p model.ProjectSubmission
		if err := rows.Scan(&p.ID, &p.CategoryID, &p.SubmitterID, &p.Title, &p.Abstract, &p.Status, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *InnovationRepository) SubmitScore(ctx context.Context, assignmentID uuid.UUID, scores []model.JudgingScore) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, s := range scores {
		_, err := tx.Exec(ctx, `
			INSERT INTO judging_scores (assignment_id, criteria_name, score, max_score, notes)
			VALUES ($1, $2, $3, $4, $5)
		`, assignmentID, s.CriteriaName, s.Score, s.MaxScore, s.Notes)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx, `UPDATE judging_assignments SET status = 'completed' WHERE id = $1`, assignmentID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
