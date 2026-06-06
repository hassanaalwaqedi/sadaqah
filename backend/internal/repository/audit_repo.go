package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

type AuditRepository struct {
	db *pgxpool.Pool
}

func NewAuditRepository(db *pgxpool.Pool) *AuditRepository {
	return &AuditRepository{db: db}
}

// Log inserts a new audit log record.
func (r *AuditRepository) Log(ctx context.Context, log *model.AuditLogCreate) error {
	query := `
		INSERT INTO audit_logs (
			user_id, action, entity_type, entity_id,
			old_values, new_values, ip_address, user_agent,
			request_id, success, target_user_id
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
	`

	oldVal, _ := json.Marshal(log.OldValues)
	newVal, _ := json.Marshal(log.NewValues)

	var oldValDB, newValDB interface{}
	if string(oldVal) != "null" { oldValDB = oldVal }
	if string(newVal) != "null" { newValDB = newVal }

	_, err := r.db.Exec(ctx, query,
		log.UserID, log.Action, log.EntityType, log.EntityID,
		oldValDB, newValDB, log.IPAddress, log.UserAgent,
		log.RequestID, log.Success, log.TargetUserID,
	)

	if err != nil {
		return fmt.Errorf("failed to insert audit log: %w", err)
	}

	return nil
}

// GetLogs retrieves audit logs with pagination and filtering.
func (r *AuditRepository) GetLogs(ctx context.Context, params model.PaginationParams, filters map[string]string) ([]model.AuditLog, int64, error) {
	baseWhere := " WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	// Apply filters
	if action, ok := filters["action"]; ok && action != "" {
		baseWhere += fmt.Sprintf(" AND action = $%d", argIdx)
		args = append(args, action)
		argIdx++
	}
	if entityType, ok := filters["entity_type"]; ok && entityType != "" {
		baseWhere += fmt.Sprintf(" AND entity_type = $%d", argIdx)
		args = append(args, entityType)
		argIdx++
	}
	if userID, ok := filters["user_id"]; ok && userID != "" {
		uid, err := uuid.Parse(userID)
		if err == nil {
			baseWhere += fmt.Sprintf(" AND user_id = $%d", argIdx)
			args = append(args, uid)
			argIdx++
		}
	}
	if from, ok := filters["from"]; ok && from != "" {
		t, err := time.Parse(time.RFC3339, from)
		if err == nil {
			baseWhere += fmt.Sprintf(" AND created_at >= $%d", argIdx)
			args = append(args, t)
			argIdx++
		}
	}
	if to, ok := filters["to"]; ok && to != "" {
		t, err := time.Parse(time.RFC3339, to)
		if err == nil {
			baseWhere += fmt.Sprintf(" AND created_at <= $%d", argIdx)
			args = append(args, t)
			argIdx++
		}
	}
	if search, ok := filters["search"]; ok && search != "" {
		baseWhere += fmt.Sprintf(" AND (action ILIKE $%d OR entity_type ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	countQuery := `SELECT COUNT(*) FROM audit_logs` + baseWhere
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	dataQuery := `SELECT id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, request_id, success, target_user_id, created_at FROM audit_logs` + baseWhere
	dataQuery += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.PageSize, (params.Page-1)*params.PageSize)

	rows, err := r.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []model.AuditLog
	for rows.Next() {
		var l model.AuditLog
		var oldVal, newVal []byte

		err := rows.Scan(
			&l.ID, &l.UserID, &l.Action, &l.EntityType, &l.EntityID,
			&oldVal, &newVal, &l.IPAddress, &l.UserAgent,
			&l.RequestID, &l.Success, &l.TargetUserID, &l.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		if len(oldVal) > 0 { json.Unmarshal(oldVal, &l.OldValues) }
		if len(newVal) > 0 { json.Unmarshal(newVal, &l.NewValues) }

		logs = append(logs, l)
	}

	return logs, total, nil
}

// GetLogsByUser returns audit logs for a specific user (as actor or target).
func (r *AuditRepository) GetLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.AuditLog, error) {
	query := `
		SELECT id, user_id, action, entity_type, entity_id, old_values, new_values,
		       ip_address, user_agent, request_id, success, target_user_id, created_at
		FROM audit_logs
		WHERE user_id = $1 OR target_user_id = $1
		ORDER BY created_at DESC
		LIMIT $2`

	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []model.AuditLog
	for rows.Next() {
		var l model.AuditLog
		var oldVal, newVal []byte

		err := rows.Scan(
			&l.ID, &l.UserID, &l.Action, &l.EntityType, &l.EntityID,
			&oldVal, &newVal, &l.IPAddress, &l.UserAgent,
			&l.RequestID, &l.Success, &l.TargetUserID, &l.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if len(oldVal) > 0 { json.Unmarshal(oldVal, &l.OldValues) }
		if len(newVal) > 0 { json.Unmarshal(newVal, &l.NewValues) }

		logs = append(logs, l)
	}

	return logs, nil
}
