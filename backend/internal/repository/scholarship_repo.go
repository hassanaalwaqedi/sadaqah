package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

// ScholarshipRepository handles data access for scholarships.
type ScholarshipRepository struct {
	db *pgxpool.Pool
}

// NewScholarshipRepository creates a new ScholarshipRepository.
func NewScholarshipRepository(db *pgxpool.Pool) *ScholarshipRepository {
	return &ScholarshipRepository{db: db}
}

// CreateCycle creates a new scholarship cycle.
func (r *ScholarshipRepository) CreateCycle(ctx context.Context, cycle *model.ScholarshipCycle) error {
	query := `
		INSERT INTO scholarship_cycles (
			id, name_en, name_ar, description, academic_year,
			application_start, application_deadline, evaluation_deadline,
			total_quota, status, configuration, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		)
	`
	_, err := r.db.Exec(ctx, query,
		cycle.ID, cycle.NameEn, cycle.NameAr, cycle.Description, cycle.AcademicYear,
		cycle.ApplicationStart, cycle.ApplicationDeadline, cycle.EvaluationDeadline,
		cycle.TotalQuota, cycle.Status, cycle.Configuration, cycle.CreatedBy, cycle.CreatedAt, cycle.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting scholarship cycle: %w", err)
	}
	return nil
}

// ListCycles returns paginated scholarship cycles.
func (r *ScholarshipRepository) ListCycles(ctx context.Context, params model.PaginationParams) ([]model.ScholarshipCycle, int64, error) {
	var total int64
	countQuery := `SELECT COUNT(*) FROM scholarship_cycles WHERE deleted_at IS NULL`
	if err := r.db.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("counting cycles: %w", err)
	}

	offset := (params.Page - 1) * params.PageSize
	query := `
		SELECT id, name_en, name_ar, description, academic_year, application_start,
		       application_deadline, evaluation_deadline, total_quota, status, configuration,
		       created_by, created_at, updated_at
		FROM scholarship_cycles
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.db.Query(ctx, query, params.PageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("querying cycles: %w", err)
	}
	defer rows.Close()

	var cycles []model.ScholarshipCycle
	for rows.Next() {
		var c model.ScholarshipCycle
		if err := rows.Scan(
			&c.ID, &c.NameEn, &c.NameAr, &c.Description, &c.AcademicYear,
			&c.ApplicationStart, &c.ApplicationDeadline, &c.EvaluationDeadline,
			&c.TotalQuota, &c.Status, &c.Configuration, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scanning cycle: %w", err)
		}
		cycles = append(cycles, c)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterating cycles: %w", err)
	}

	return cycles, total, nil
}

func (r *ScholarshipRepository) GetApplicationByID(ctx context.Context, id uuid.UUID) (*model.ScholarshipApplication, error) {
	query := `
		SELECT id, cycle_id, applicant_id, status, submitted_at, family_income, family_size, created_at, updated_at
		FROM scholarship_applications
		WHERE id = $1
	`
	var app model.ScholarshipApplication
	err := r.db.QueryRow(ctx, query, id).Scan(
		&app.ID, &app.CycleID, &app.ApplicantID, &app.Status, &app.SubmittedAt,
		&app.FamilyIncome, &app.FamilySize, &app.CreatedAt, &app.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get application: %w", err)
	}
	return &app, nil
}

// CreateApplication creates a new student application.
func (r *ScholarshipRepository) CreateApplication(ctx context.Context, app *model.ScholarshipApplication) error {
	query := `
		INSERT INTO scholarship_applications (
			id, cycle_id, applicant_id, status, submitted_at,
			family_income, family_size, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		)
	`
	_, err := r.db.Exec(ctx, query,
		app.ID, app.CycleID, app.ApplicantID, app.Status, app.SubmittedAt,
		app.FamilyIncome, app.FamilySize, app.CreatedAt, app.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting scholarship application: %w", err)
	}
	return nil
}

// SaveDocument saves an application document record.
func (r *ScholarshipRepository) SaveDocument(ctx context.Context, id, appID, fileID uuid.UUID, docType string) error {
	query := `
		INSERT INTO application_documents (id, application_id, file_id, document_type, uploaded_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(ctx, query, id, appID, fileID, docType, time.Now())
	if err != nil {
		return fmt.Errorf("inserting document: %w", err)
	}
	return nil
}

func (r *ScholarshipRepository) GetCycleByID(ctx context.Context, id uuid.UUID) (*model.ScholarshipCycle, error) {
	query := `SELECT id, name_en, name_ar, description, academic_year, application_start, application_deadline, evaluation_deadline, total_quota, status, configuration, created_at, updated_at FROM scholarship_cycles WHERE id = $1`
	var c model.ScholarshipCycle
	err := r.db.QueryRow(ctx, query, id).Scan(&c.ID, &c.NameEn, &c.NameAr, &c.Description, &c.AcademicYear, &c.ApplicationStart, &c.ApplicationDeadline, &c.EvaluationDeadline, &c.TotalQuota, &c.Status, &c.Configuration, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ScholarshipRepository) UpdateCycle(ctx context.Context, c *model.ScholarshipCycle) error {
	query := `UPDATE scholarship_cycles SET name_en = $1, name_ar = $2, description = $3, academic_year = $4, application_start = $5, application_deadline = $6, evaluation_deadline = $7, total_quota = $8, status = $9, configuration = $10, updated_at = $11 WHERE id = $12`
	_, err := r.db.Exec(ctx, query, c.NameEn, c.NameAr, c.Description, c.AcademicYear, c.ApplicationStart, c.ApplicationDeadline, c.EvaluationDeadline, c.TotalQuota, c.Status, c.Configuration, time.Now(), c.ID)
	return err
}

func (r *ScholarshipRepository) GetApplicationByCycleAndApplicant(ctx context.Context, cycleID, applicantID uuid.UUID) (*model.ScholarshipApplication, error) {
	query := `SELECT id FROM scholarship_applications WHERE cycle_id = $1 AND applicant_id = $2`
	var p model.ScholarshipApplication
	err := r.db.QueryRow(ctx, query, cycleID, applicantID).Scan(&p.ID)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ScholarshipRepository) GetApplicationsByCycle(ctx context.Context, cycleID uuid.UUID) ([]model.ScholarshipApplication, error) {
	query := `SELECT id, cycle_id, applicant_id, status, submitted_at, gpa_verified, family_income, family_size, distance_km, special_circumstances, admin_notes, final_score, final_rank, extra_data, created_at, updated_at FROM scholarship_applications WHERE cycle_id = $1`
	rows, err := r.db.Query(ctx, query, cycleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var apps []model.ScholarshipApplication
	for rows.Next() {
		var p model.ScholarshipApplication
		if err := rows.Scan(&p.ID, &p.CycleID, &p.ApplicantID, &p.Status, &p.SubmittedAt, &p.GpaVerified, &p.FamilyIncome, &p.FamilySize, &p.DistanceKm, &p.SpecialCircumstances, &p.AdminNotes, &p.FinalScore, &p.FinalRank, &p.ExtraData, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, p)
	}
	return apps, nil
}

func (r *ScholarshipRepository) GetApplicationsByApplicant(ctx context.Context, applicantID uuid.UUID) ([]model.ScholarshipApplication, error) {
	query := `SELECT id, cycle_id, applicant_id, status, submitted_at, gpa_verified, family_income, family_size, distance_km, special_circumstances, admin_notes, final_score, final_rank, extra_data, created_at, updated_at FROM scholarship_applications WHERE applicant_id = $1`
	rows, err := r.db.Query(ctx, query, applicantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var apps []model.ScholarshipApplication
	for rows.Next() {
		var p model.ScholarshipApplication
		if err := rows.Scan(&p.ID, &p.CycleID, &p.ApplicantID, &p.Status, &p.SubmittedAt, &p.GpaVerified, &p.FamilyIncome, &p.FamilySize, &p.DistanceKm, &p.SpecialCircumstances, &p.AdminNotes, &p.FinalScore, &p.FinalRank, &p.ExtraData, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, p)
	}
	return apps, nil
}

func (r *ScholarshipRepository) GetScholarshipTimeline(ctx context.Context, appID uuid.UUID) ([]model.ScholarshipTimeline, error) {
	query := `SELECT id, application_id, user_id, status_from, status_to, notes, created_at FROM scholarship_timeline WHERE application_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, appID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var timeline []model.ScholarshipTimeline
	for rows.Next() {
		var t model.ScholarshipTimeline
		if err := rows.Scan(&t.ID, &t.ApplicationID, &t.UserID, &t.StatusFrom, &t.StatusTo, &t.Notes, &t.CreatedAt); err != nil {
			return nil, err
		}
		timeline = append(timeline, t)
	}
	return timeline, nil
}

func (r *ScholarshipRepository) GetScholarshipMessages(ctx context.Context, appID uuid.UUID, includeInternal bool) ([]model.ScholarshipMessage, error) {
	query := `SELECT id, application_id, sender_id, message, is_internal, created_at FROM scholarship_messages WHERE application_id = $1`
	var rows pgx.Rows
	var err error
	if includeInternal {
		query += ` ORDER BY created_at ASC`
		rows, err = r.db.Query(ctx, query, appID)
	} else {
		query += ` AND is_internal = false ORDER BY created_at ASC`
		rows, err = r.db.Query(ctx, query, appID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []model.ScholarshipMessage
	for rows.Next() {
		var m model.ScholarshipMessage
		if err := rows.Scan(&m.ID, &m.ApplicationID, &m.SenderID, &m.Message, &m.IsInternal, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

func (r *ScholarshipRepository) UpdateApplicationStatus(ctx context.Context, appID uuid.UUID, status string) error {
	query := `UPDATE scholarship_applications SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, time.Now(), appID)
	return err
}

func (r *ScholarshipRepository) InsertScholarshipTimeline(ctx context.Context, timeline *model.ScholarshipTimeline) error {
	query := `INSERT INTO scholarship_timeline (id, application_id, user_id, status_from, status_to, notes) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, timeline.ID, timeline.ApplicationID, timeline.UserID, timeline.StatusFrom, timeline.StatusTo, timeline.Notes)
	return err
}

func (r *ScholarshipRepository) InsertScholarshipMessage(ctx context.Context, msg *model.ScholarshipMessage) error {
	query := `INSERT INTO scholarship_messages (id, application_id, sender_id, message, is_internal) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, msg.ID, msg.ApplicationID, msg.SenderID, msg.Message, msg.IsInternal)
	return err
}

func (r *ScholarshipRepository) AssignReviewer(ctx context.Context, appID, reviewerID uuid.UUID) error {
    return nil
}

func (r *ScholarshipRepository) GetApplicationsByAssignee(ctx context.Context, assigneeID uuid.UUID) ([]model.ScholarshipApplication, error) {
	query := `SELECT id, cycle_id, applicant_id, status, submitted_at, gpa_verified, family_income, family_size, distance_km, special_circumstances, admin_notes, final_score, final_rank, extra_data, assigned_to, reviewer_id, department, committee, sla_deadline, priority, created_at, updated_at FROM scholarship_applications WHERE assigned_to = $1 OR reviewer_id = $1`
	rows, err := r.db.Query(ctx, query, assigneeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var apps []model.ScholarshipApplication
	for rows.Next() {
		var p model.ScholarshipApplication
		if err := rows.Scan(&p.ID, &p.CycleID, &p.ApplicantID, &p.Status, &p.SubmittedAt, &p.GpaVerified, &p.FamilyIncome, &p.FamilySize, &p.DistanceKm, &p.SpecialCircumstances, &p.AdminNotes, &p.FinalScore, &p.FinalRank, &p.ExtraData, &p.AssignedTo, &p.ReviewerID, &p.Department, &p.Committee, &p.SLADeadline, &p.Priority, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, p)
	}
	return apps, nil
}

func (r *ScholarshipRepository) AssignApplication(ctx context.Context, appID uuid.UUID, req *model.AssignCaseRequest) error {
	query := `UPDATE scholarship_applications SET assigned_to = $1, reviewer_id = $2, department = $3, committee = $4, sla_deadline = $5, updated_at = $6 WHERE id = $7`
	_, err := r.db.Exec(ctx, query, req.AssignedTo, req.ReviewerID, req.Department, req.Committee, req.SLADeadline, time.Now(), appID)
	return err
}

func (r *ScholarshipRepository) UpdateApplicationPriority(ctx context.Context, appID uuid.UUID, priority string) error {
    query := `UPDATE scholarship_applications SET priority = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, priority, time.Now(), appID)
	return err
}

func (r *ScholarshipRepository) SubmitScholarshipEvaluation(ctx context.Context, eval *model.ScholarshipEvaluation) error {
    return nil
}

func (r *ScholarshipRepository) UpdateApplication(ctx context.Context, app *model.ScholarshipApplication) error {
    return nil
}

func (r *ScholarshipRepository) GetApplicantProfile(ctx context.Context, applicantID uuid.UUID) (*model.UserWithProfile, error) {
    return nil, nil
}

func (r *ScholarshipRepository) GetEvaluationsByApplication(ctx context.Context, appID uuid.UUID) ([]model.ScholarshipEvaluation, error) {
    return nil, nil
}

func (r *ScholarshipRepository) SubmitScore(ctx context.Context, evalID uuid.UUID, criteriaID uuid.UUID, score float64, notes *string) error {
    return nil
}
