package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
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
			total_quota, status, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
	`
	_, err := r.db.Exec(ctx, query,
		cycle.ID, cycle.NameEn, cycle.NameAr, cycle.Description, cycle.AcademicYear,
		cycle.ApplicationStart, cycle.ApplicationDeadline, cycle.EvaluationDeadline,
		cycle.TotalQuota, cycle.Status, cycle.CreatedBy, cycle.CreatedAt, cycle.UpdatedAt,
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
		       application_deadline, evaluation_deadline, total_quota, status,
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
			&c.TotalQuota, &c.Status, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt,
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
