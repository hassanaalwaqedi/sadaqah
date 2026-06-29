package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sadaqah/backend/internal/model"
)

type ResearchRepository struct {
	db *pgxpool.Pool
}

func NewResearchRepository(db *pgxpool.Pool) *ResearchRepository {
	return &ResearchRepository{db: db}
}

func (r *ResearchRepository) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 1. Active Projects
	var activeProjects int
	err := r.db.QueryRow(ctx, "SELECT count(*) FROM research_projects WHERE status = 'active' AND deleted_at IS NULL").Scan(&activeProjects)
	if err != nil {
		return nil, err
	}
	stats["active_projects"] = activeProjects

	// 2. Open Grants
	var openGrants int
	err = r.db.QueryRow(ctx, "SELECT count(*) FROM research_grant_programs WHERE status = 'open' AND deleted_at IS NULL").Scan(&openGrants)
	if err != nil {
		return nil, err
	}
	stats["open_grants"] = openGrants

	// 3. Published Papers
	var publishedPapers int
	err = r.db.QueryRow(ctx, "SELECT count(*) FROM research_publications WHERE status = 'published' AND publication_type IN ('journal', 'conference')").Scan(&publishedPapers)
	if err != nil {
		return nil, err
	}
	stats["published_papers"] = publishedPapers

	// 4. Upcoming Conferences
	var upcomingConferences int
	err = r.db.QueryRow(ctx, "SELECT count(*) FROM innovation_events WHERE event_type = 'conference' AND status IN ('open', 'judging') AND deleted_at IS NULL").Scan(&upcomingConferences)
	if err != nil {
		return nil, err
	}
	stats["upcoming_conferences"] = upcomingConferences

	return stats, nil
}

func (r *ResearchRepository) GetOpenGrantPrograms(ctx context.Context) ([]model.ResearchGrantProgram, error) {
	query := `
		SELECT id, name_en, name_ar, description, total_budget_pool, max_budget_per_project, application_start, application_deadline, status, created_at
		FROM research_grant_programs
		WHERE status = 'open' AND deleted_at IS NULL
		ORDER BY application_deadline ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var grants []model.ResearchGrantProgram
	for rows.Next() {
		var g model.ResearchGrantProgram
		if err := rows.Scan(&g.ID, &g.NameEn, &g.NameAr, &g.Description, &g.TotalBudgetPool, &g.MaxBudgetPerProject, &g.ApplicationStart, &g.ApplicationDeadline, &g.Status, &g.CreatedAt); err != nil {
			return nil, err
		}
		grants = append(grants, g)
	}
	return grants, nil
}

func (r *ResearchRepository) GetRecentPublications(ctx context.Context, limit int) ([]model.ResearchPublication, error) {
	query := `
		SELECT id, project_id, user_id, title, publication_type, journal_name, publication_date, doi, abstract, file_id, status, created_at
		FROM research_publications
		WHERE status = 'published'
		ORDER BY publication_date DESC NULLS LAST, created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pubs []model.ResearchPublication
	for rows.Next() {
		var p model.ResearchPublication
		if err := rows.Scan(&p.ID, &p.ProjectID, &p.UserID, &p.Title, &p.PublicationType, &p.JournalName, &p.PublicationDate, &p.DOI, &p.Abstract, &p.FileID, &p.Status, &p.CreatedAt); err != nil {
			return nil, err
		}
		pubs = append(pubs, p)
	}
	return pubs, nil
}

func (r *ResearchRepository) GetActiveProjects(ctx context.Context, limit int) ([]model.ResearchProject, error) {
	query := `
		SELECT id, grant_program_id, title, abstract, requested_budget, approved_budget, status, start_date, end_date, extra_data, created_at
		FROM research_projects
		WHERE status = 'active' AND deleted_at IS NULL
		ORDER BY start_date DESC NULLS LAST, created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.ResearchProject
	for rows.Next() {
		var p model.ResearchProject
		if err := rows.Scan(&p.ID, &p.GrantProgramID, &p.Title, &p.Abstract, &p.RequestedBudget, &p.ApprovedBudget, &p.Status, &p.StartDate, &p.EndDate, &p.ExtraData, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *ResearchRepository) GetUpcomingConferences(ctx context.Context, limit int) ([]model.InnovationEvent, error) {
	query := `
		SELECT id, name_en, name_ar, description, event_date, submission_deadline, status, event_type, created_at
		FROM innovation_events
		WHERE event_type = 'conference' AND status IN ('open', 'judging') AND deleted_at IS NULL
		ORDER BY event_date ASC NULLS LAST, created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []model.InnovationEvent
	for rows.Next() {
		var e model.InnovationEvent
		if err := rows.Scan(&e.ID, &e.NameEn, &e.NameAr, &e.Description, &e.EventDate, &e.SubmissionDeadline, &e.Status, &e.EventType, &e.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}
