package service

import (
	"context"
	"log/slog"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type AuditService struct {
	repo   *repository.AuditRepository
	logger *slog.Logger
}

func NewAuditService(repo *repository.AuditRepository, logger *slog.Logger) *AuditService {
	return &AuditService{repo: repo, logger: logger}
}

// LogAction synchronously writes an audit log. Should be called for sensitive financial/admin operations.
func (s *AuditService) LogAction(ctx context.Context, action, entityType string, entityID uuid.UUID, oldVal, newVal interface{}) {
	var userID *uuid.UUID
	if id, ok := middleware.GetUserID(ctx); ok {
		userID = &id
	}

	ipAddress := ""
	if ip, ok := ctx.Value("client_ip").(string); ok {
		ipAddress = ip
	}

	userAgent := ""
	if ua, ok := ctx.Value("user_agent").(string); ok {
		userAgent = ua
	}

	requestID := middleware.GetRequestID(ctx)

	logRecord := &model.AuditLogCreate{
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		OldValues:  oldVal,
		NewValues:  newVal,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		RequestID:  requestID,
		Success:    true,
	}

	if err := s.repo.Log(ctx, logRecord); err != nil {
		s.logger.Error("failed to write audit log", slog.String("error", err.Error()), slog.String("action", action))
	}
}

// LogAdminAction writes an audit log for admin operations with target user tracking.
func (s *AuditService) LogAdminAction(ctx context.Context, action, entityType string, entityID uuid.UUID, targetUserID *uuid.UUID, success bool, oldVal, newVal interface{}) {
	var userID *uuid.UUID
	if id, ok := middleware.GetUserID(ctx); ok {
		userID = &id
	}

	ipAddress := ""
	if ip, ok := ctx.Value("client_ip").(string); ok {
		ipAddress = ip
	}

	userAgent := ""
	if ua, ok := ctx.Value("user_agent").(string); ok {
		userAgent = ua
	}

	requestID := middleware.GetRequestID(ctx)

	logRecord := &model.AuditLogCreate{
		UserID:       userID,
		Action:       action,
		EntityType:   entityType,
		EntityID:     entityID,
		OldValues:    oldVal,
		NewValues:    newVal,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		RequestID:    requestID,
		Success:      success,
		TargetUserID: targetUserID,
	}

	if err := s.repo.Log(ctx, logRecord); err != nil {
		s.logger.Error("failed to write admin audit log", slog.String("error", err.Error()), slog.String("action", action))
	}
}

// GetLogs returns audit logs for admins with filtering.
func (s *AuditService) GetLogs(ctx context.Context, params model.PaginationParams, filters map[string]string) (model.PaginatedResponse, error) {
	logs, total, err := s.repo.GetLogs(ctx, params, filters)
	if err != nil {
		return model.PaginatedResponse{}, err
	}

	// Calculate pagination
	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize != 0 {
		totalPages++
	}

	return model.PaginatedResponse{
		Data:       logs,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GetLogsByUser returns audit logs for a specific user.
func (s *AuditService) GetLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.AuditLog, error) {
	return s.repo.GetLogsByUser(ctx, userID, limit)
}
