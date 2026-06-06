package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

// UserService handles user management business logic.
type UserService struct {
	userRepo     *repository.UserRepository
	auditRepo    *repository.AuditRepository
	auditService *AuditService
	rbacService  *RBACService
	emailService *EmailService
	logger       *slog.Logger
}

// NewUserService creates a new UserService.
func NewUserService(userRepo *repository.UserRepository, auditService *AuditService, emailService *EmailService, logger *slog.Logger) *UserService {
	return &UserService{
		userRepo:     userRepo,
		auditService: auditService,
		emailService: emailService,
		logger:       logger,
	}
}

// SetRBACService sets the RBAC service (to avoid circular deps during init).
func (s *UserService) SetRBACService(rbacService *RBACService) {
	s.rbacService = rbacService
}

// SetAuditRepo sets the audit repository (to avoid circular deps during init).
func (s *UserService) SetAuditRepo(auditRepo *repository.AuditRepository) {
	s.auditRepo = auditRepo
}

// ListUsers retrieves a paginated list of users with their basic info.
func (s *UserService) ListUsers(ctx context.Context, params model.PaginationParams) (model.PaginatedResponse, error) {
	filters := model.UserFilterParams{PaginationParams: params}
	return s.ListUsersFiltered(ctx, filters)
}

// ListUsersFiltered retrieves a paginated list of users with role/status filters.
func (s *UserService) ListUsersFiltered(ctx context.Context, filters model.UserFilterParams) (model.PaginatedResponse, error) {
	users, total, err := s.userRepo.ListWithFilters(ctx, filters)
	if err != nil {
		return model.PaginatedResponse{}, fmt.Errorf("listing users: %w", err)
	}

	type UserListItem struct {
		model.User
		Roles []string `json:"roles"`
	}

	items := make([]UserListItem, len(users))
	for i, u := range users {
		roles, _ := s.userRepo.GetUserRoleNames(ctx, u.ID)
		items[i] = UserListItem{
			User:  u,
			Roles: roles,
		}
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(filters.PageSize) - 1) / int64(filters.PageSize))
	}

	return model.PaginatedResponse{
		Data:       items,
		Total:      total,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GetUser retrieves a user by ID including their profile and roles.
func (s *UserService) GetUser(ctx context.Context, id uuid.UUID) (*model.UserWithProfile, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	profile, _ := s.userRepo.GetProfile(ctx, id)
	roles, _ := s.userRepo.GetUserRoles(ctx, id)

	return &model.UserWithProfile{
		User:    *user,
		Profile: profile,
		Roles:   roles,
	}, nil
}

// AssignRole assigns a specific role to a user.
func (s *UserService) AssignRole(ctx context.Context, targetUserID uuid.UUID, roleName string, assignedBy uuid.UUID) error {
	role, err := s.userRepo.GetRoleByName(ctx, roleName)
	if err != nil {
		return fmt.Errorf("fetching role: %w", err)
	}
	if role == nil {
		return fmt.Errorf("role '%s' not found", roleName)
	}

	if err := s.userRepo.AssignRole(ctx, targetUserID, role.ID, assignedBy); err != nil {
		return fmt.Errorf("assigning role: %w", err)
	}

	// Invalidate permission cache
	if s.rbacService != nil {
		s.rbacService.InvalidateUserPermissionCache(ctx, targetUserID)
	}

	s.auditService.LogAdminAction(ctx, "ASSIGN_ROLE", "user", targetUserID, &targetUserID, true, nil, map[string]interface{}{"role": roleName})
	s.logger.Info("role assigned", slog.String("user_id", targetUserID.String()), slog.String("role", roleName))
	return nil
}

// RemoveRole removes a specific role from a user.
func (s *UserService) RemoveRole(ctx context.Context, targetUserID, roleID, removedBy uuid.UUID) error {
	if err := s.userRepo.RemoveRole(ctx, targetUserID, roleID); err != nil {
		return fmt.Errorf("removing role: %w", err)
	}

	// Invalidate permission cache
	if s.rbacService != nil {
		s.rbacService.InvalidateUserPermissionCache(ctx, targetUserID)
	}

	s.auditService.LogAdminAction(ctx, "REMOVE_ROLE", "user", targetUserID, &targetUserID, true, map[string]interface{}{"role_id": roleID}, nil)
	s.logger.Info("role removed", slog.String("user_id", targetUserID.String()), slog.String("role_id", roleID.String()))
	return nil
}

// DeactivateUser soft-deletes or sets is_active=false for a user.
func (s *UserService) DeactivateUser(ctx context.Context, targetUserID uuid.UUID, deactivatedBy uuid.UUID) error {
	if err := s.userRepo.SoftDelete(ctx, targetUserID); err != nil {
		return fmt.Errorf("deactivating user: %w", err)
	}

	s.auditService.LogAdminAction(ctx, "DEACTIVATE_USER", "user", targetUserID, &targetUserID, true, nil, nil)
	_ = s.userRepo.RevokeAllUserRefreshTokens(ctx, targetUserID)

	s.logger.Info("user deactivated", slog.String("user_id", targetUserID.String()))
	return nil
}

// SuspendUser temporarily suspends a user (sets is_active=false without deleting).
func (s *UserService) SuspendUser(ctx context.Context, targetUserID, suspendedBy uuid.UUID, reason string) error {
	if err := s.userRepo.SuspendUser(ctx, targetUserID); err != nil {
		return fmt.Errorf("suspending user: %w", err)
	}

	s.auditService.LogAdminAction(ctx, "SUSPEND_USER", "user", targetUserID, &targetUserID, true,
		nil, map[string]interface{}{"reason": reason})

	_ = s.userRepo.RevokeAllUserRefreshTokens(ctx, targetUserID)

	s.logger.Info("user suspended", slog.String("user_id", targetUserID.String()), slog.String("reason", reason))
	return nil
}

// ReactivateUser re-enables a suspended user.
func (s *UserService) ReactivateUser(ctx context.Context, targetUserID, reactivatedBy uuid.UUID) error {
	if err := s.userRepo.ReactivateUser(ctx, targetUserID); err != nil {
		return fmt.Errorf("reactivating user: %w", err)
	}

	s.auditService.LogAdminAction(ctx, "REACTIVATE_USER", "user", targetUserID, &targetUserID, true, nil, nil)
	s.logger.Info("user reactivated", slog.String("user_id", targetUserID.String()))
	return nil
}

// ForceLogout revokes all sessions for a user.
func (s *UserService) ForceLogout(ctx context.Context, targetUserID, forcedBy uuid.UUID) error {
	if err := s.userRepo.RevokeAllUserRefreshTokens(ctx, targetUserID); err != nil {
		return fmt.Errorf("revoking tokens: %w", err)
	}

	// Invalidate permission cache to force re-authentication
	if s.rbacService != nil {
		s.rbacService.InvalidateUserPermissionCache(ctx, targetUserID)
	}

	s.auditService.LogAdminAction(ctx, "FORCE_LOGOUT", "user", targetUserID, &targetUserID, true, nil, nil)
	s.logger.Info("user force-logged out", slog.String("user_id", targetUserID.String()))
	return nil
}

// GetLoginHistory returns login attempts for a user.
func (s *UserService) GetLoginHistory(ctx context.Context, userID uuid.UUID, limit int) ([]model.LoginAttempt, error) {
	return s.userRepo.GetLoginHistory(ctx, userID, limit)
}

// GetUserActivity returns audit logs for a specific user.
func (s *UserService) GetUserActivity(ctx context.Context, userID uuid.UUID, limit int) ([]model.AuditLog, error) {
	if s.auditRepo != nil {
		return s.auditRepo.GetLogsByUser(ctx, userID, limit)
	}
	return nil, nil
}

