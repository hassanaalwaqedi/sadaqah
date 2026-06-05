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
	userRepo *repository.UserRepository
	logger   *slog.Logger
}

// NewUserService creates a new UserService.
func NewUserService(userRepo *repository.UserRepository, logger *slog.Logger) *UserService {
	return &UserService{
		userRepo: userRepo,
		logger:   logger,
	}
}

// ListUsers retrieves a paginated list of users with their basic info.
func (s *UserService) ListUsers(ctx context.Context, params model.PaginationParams) (model.PaginatedResponse, error) {
	users, total, err := s.userRepo.List(ctx, params)
	if err != nil {
		return model.PaginatedResponse{}, fmt.Errorf("listing users: %w", err)
	}

	// For an admin list, we might want to attach roles and basic profile info to each user.
	// For performance on large lists, a dedicated DB query joining these tables would be better.
	// Here we just return the raw users as a baseline.
	
	// Create simplified view models for the frontend
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

	// Calculate total pages
	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(params.PageSize) - 1) / int64(params.PageSize))
	}

	return model.PaginatedResponse{
		Data:       items,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
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

	// Create audit log
	auditLog := &model.AuditLog{
		ID:         uuid.New(),
		UserID:     &assignedBy,
		Action:     "ASSIGN_ROLE",
		EntityType: "user",
		EntityID:   targetUserID,
		NewValues:  map[string]interface{}{"role": roleName},
	}
	_ = s.userRepo.CreateAuditLog(ctx, auditLog)

	s.logger.Info("role assigned", slog.String("user_id", targetUserID.String()), slog.String("role", roleName))
	return nil
}

// DeactivateUser soft-deletes or sets is_active=false for a user.
func (s *UserService) DeactivateUser(ctx context.Context, targetUserID uuid.UUID, deactivatedBy uuid.UUID) error {
	if err := s.userRepo.SoftDelete(ctx, targetUserID); err != nil {
		return fmt.Errorf("deactivating user: %w", err)
	}

	// Create audit log
	auditLog := &model.AuditLog{
		ID:         uuid.New(),
		UserID:     &deactivatedBy,
		Action:     "DEACTIVATE_USER",
		EntityType: "user",
		EntityID:   targetUserID,
	}
	_ = s.userRepo.CreateAuditLog(ctx, auditLog)

	// Revoke all refresh tokens
	_ = s.userRepo.RevokeAllUserRefreshTokens(ctx, targetUserID)

	s.logger.Info("user deactivated", slog.String("user_id", targetUserID.String()))
	return nil
}
