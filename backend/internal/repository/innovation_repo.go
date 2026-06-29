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

func (r *InnovationRepository) GetEventByID(ctx context.Context, id uuid.UUID) (*model.InnovationEvent, error) {
	query := `SELECT id, name_en, name_ar, description, event_date, submission_deadline, status, event_type, configuration, created_by, created_at FROM innovation_events WHERE id = $1`
	var event model.InnovationEvent
	err := r.db.QueryRow(ctx, query, id).Scan(&event.ID, &event.NameEn, &event.NameAr, &event.Description, &event.EventDate, &event.SubmissionDeadline, &event.Status, &event.EventType, &event.Configuration, &event.CreatedBy, &event.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *InnovationRepository) GetMyProjects(ctx context.Context, userID uuid.UUID) ([]model.ProjectSubmission, error) {
	query := `SELECT id, category_id, submitter_id, title, abstract, description, extra_data, status, created_at FROM project_submissions WHERE submitter_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var projects []model.ProjectSubmission
	for rows.Next() {
		var p model.ProjectSubmission
		if err := rows.Scan(&p.ID, &p.CategoryID, &p.SubmitterID, &p.Title, &p.Abstract, &p.Description, &p.ExtraData, &p.Status, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *InnovationRepository) GetApplicationsByEvent(ctx context.Context, eventID uuid.UUID) ([]model.ProjectSubmission, error) {
	query := `SELECT p.id, p.category_id, p.submitter_id, p.title, p.abstract, p.description, p.extra_data, p.status, p.created_at FROM project_submissions p JOIN innovation_events c ON p.category_id = c.id WHERE c.id = $1`
	rows, err := r.db.Query(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var projects []model.ProjectSubmission
	for rows.Next() {
		var p model.ProjectSubmission
		if err := rows.Scan(&p.ID, &p.CategoryID, &p.SubmitterID, &p.Title, &p.Abstract, &p.Description, &p.ExtraData, &p.Status, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *InnovationRepository) GetApplicationByID(ctx context.Context, id uuid.UUID) (*model.ProjectSubmission, error) {
	query := `SELECT id, category_id, submitter_id, title, abstract, description, extra_data, status, created_at FROM project_submissions WHERE id = $1`
	var p model.ProjectSubmission
	err := r.db.QueryRow(ctx, query, id).Scan(&p.ID, &p.CategoryID, &p.SubmitterID, &p.Title, &p.Abstract, &p.Description, &p.ExtraData, &p.Status, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *InnovationRepository) GetProjectTimeline(ctx context.Context, projectID uuid.UUID) ([]model.ProjectTimeline, error) {
	query := `SELECT id, project_id, user_id, status_from, status_to, title, description, created_at FROM project_timeline WHERE project_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var timeline []model.ProjectTimeline
	for rows.Next() {
		var t model.ProjectTimeline
		if err := rows.Scan(&t.ID, &t.ProjectID, &t.UserID, &t.StatusFrom, &t.StatusTo, &t.Title, &t.Description, &t.CreatedAt); err != nil {
			return nil, err
		}
		timeline = append(timeline, t)
	}
	return timeline, nil
}

func (r *InnovationRepository) GetProjectMessages(ctx context.Context, projectID uuid.UUID, includeInternal bool) ([]model.ProjectMessage, error) {
	query := `SELECT id, project_id, sender_id, message, is_internal, created_at FROM project_messages WHERE project_id = $1 ORDER BY created_at ASC`
	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []model.ProjectMessage
	for rows.Next() {
		var m model.ProjectMessage
		if err := rows.Scan(&m.ID, &m.ProjectID, &m.SenderID, &m.Message, &m.IsInternal, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

func (r *InnovationRepository) GetSubmitterProfile(ctx context.Context, userID uuid.UUID) (*model.UserWithProfile, error) {
	query := `SELECT id, email, is_active, created_at FROM users WHERE id = $1`
	var user model.UserWithProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(&user.ID, &user.Email, &user.IsActive, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *InnovationRepository) GetJudgingAssignmentsByProject(ctx context.Context, projectID uuid.UUID) ([]model.JudgingAssignment, error) {
	query := `SELECT id, project_id, judge_id, status, assigned_at FROM judging_assignments WHERE project_id = $1`
	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var assignments []model.JudgingAssignment
	for rows.Next() {
		var a model.JudgingAssignment
		if err := rows.Scan(&a.ID, &a.ProjectID, &a.JudgeID, &a.Status, &a.AssignedAt); err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	return assignments, nil
}

func (r *InnovationRepository) GetJudgingScoresByProject(ctx context.Context, projectID uuid.UUID) ([]model.JudgingScore, error) {
	query := `SELECT s.id, s.assignment_id, s.criteria_name, s.score, s.max_score, s.notes FROM evaluation_scores s JOIN judging_assignments a ON s.assignment_id = a.id WHERE a.project_id = $1`
	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var scores []model.JudgingScore
	for rows.Next() {
		var s model.JudgingScore
		if err := rows.Scan(&s.ID, &s.AssignmentID, &s.CriteriaName, &s.Score, &s.MaxScore, &s.Notes); err != nil {
			return nil, err
		}
		scores = append(scores, s)
	}
	return scores, nil
}

func (r *InnovationRepository) UpdateApplicationStatus(ctx context.Context, appID uuid.UUID, status string) error {
	query := `UPDATE project_submissions SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, status, appID)
	return err
}

func (r *InnovationRepository) InsertProjectTimeline(ctx context.Context, timeline *model.ProjectTimeline) error {
	query := `INSERT INTO project_timeline (id, project_id, user_id, status_from, status_to, title, description) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, timeline.ID, timeline.ProjectID, timeline.UserID, timeline.StatusFrom, timeline.StatusTo, timeline.Title, timeline.Description)
	return err
}

func (r *InnovationRepository) InsertProjectMessage(ctx context.Context, msg *model.ProjectMessage) error {
	query := `INSERT INTO project_messages (id, project_id, sender_id, message, is_internal) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, msg.ID, msg.ProjectID, msg.SenderID, msg.Message, msg.IsInternal)
	return err
}

func (r *InnovationRepository) GetProjectCertificates(ctx context.Context, projectID uuid.UUID) ([]model.ProjectCertificate, error) {
    return []model.ProjectCertificate{}, nil
}

func (r *InnovationRepository) UpdateProjectExtraData(ctx context.Context, projectID uuid.UUID, extraData map[string]interface{}) error {
    return nil
}
