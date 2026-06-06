package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

// RBACService handles role and permission business logic.
type RBACService struct {
	rbacRepo     *repository.RBACRepository
	userRepo     *repository.UserRepository
	auditService *AuditService
	rdb          *redis.Client
	logger       *slog.Logger
}

// NewRBACService creates a new RBACService.
func NewRBACService(
	rbacRepo *repository.RBACRepository,
	userRepo *repository.UserRepository,
	auditService *AuditService,
	rdb *redis.Client,
	logger *slog.Logger,
) *RBACService {
	return &RBACService{
		rbacRepo:     rbacRepo,
		userRepo:     userRepo,
		auditService: auditService,
		rdb:          rdb,
		logger:       logger,
	}
}

// ── Role Operations ──

// ListRoles returns all roles with permission and user counts.
func (s *RBACService) ListRoles(ctx context.Context, includeInactive bool) ([]model.RoleWithCounts, error) {
	return s.rbacRepo.ListRoles(ctx, includeInactive)
}

// GetRole retrieves a role with its full permissions list.
func (s *RBACService) GetRole(ctx context.Context, id uuid.UUID) (*model.RoleWithPermissions, error) {
	role, err := s.rbacRepo.GetRoleByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting role: %w", err)
	}
	if role == nil {
		return nil, fmt.Errorf("role not found")
	}
	return role, nil
}

// CreateRole creates a new custom role with optional initial permissions.
// Enforces privilege escalation guard: actor can only assign permissions they possess.
func (s *RBACService) CreateRole(ctx context.Context, req model.CreateRoleRequest, actorID uuid.UUID) (*model.Role, error) {
	// Check for duplicate name
	exists, err := s.rbacRepo.RoleNameExists(ctx, req.Name, nil)
	if err != nil {
		return nil, fmt.Errorf("checking role name: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("role name '%s' already exists", req.Name)
	}

	// Privilege escalation check for initial permissions
	if len(req.PermissionIDs) > 0 {
		if err := s.checkPrivilegeEscalation(ctx, actorID, req.PermissionIDs); err != nil {
			return nil, err
		}
	}

	now := time.Now().UTC()
	role := &model.Role{
		ID:            uuid.New(),
		Name:          req.Name,
		DisplayNameEN: req.DisplayNameEN,
		DisplayNameAR: req.DisplayNameAR,
		Description:   req.Description,
		IsSystem:      false,
		IsActive:      true,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.rbacRepo.CreateRole(ctx, role); err != nil {
		return nil, fmt.Errorf("creating role: %w", err)
	}

	// Assign initial permissions
	if len(req.PermissionIDs) > 0 {
		if err := s.rbacRepo.AssignPermissionsToRole(ctx, role.ID, req.PermissionIDs); err != nil {
			return nil, fmt.Errorf("assigning initial permissions: %w", err)
		}
	}

	// Audit log
	s.auditService.LogAction(ctx, "CREATE_ROLE", "role", role.ID, nil, map[string]interface{}{
		"name":        role.Name,
		"permissions": len(req.PermissionIDs),
	})

	s.logger.Info("role created", slog.String("role", role.Name), slog.String("actor", actorID.String()))
	return role, nil
}

// CloneRole duplicates an existing role's permissions into a new role.
func (s *RBACService) CloneRole(ctx context.Context, sourceID uuid.UUID, req model.CloneRoleRequest, actorID uuid.UUID) (*model.Role, error) {
	// Get source role
	source, err := s.rbacRepo.GetRoleByID(ctx, sourceID)
	if err != nil {
		return nil, fmt.Errorf("getting source role: %w", err)
	}
	if source == nil {
		return nil, fmt.Errorf("source role not found")
	}

	// Check name uniqueness
	exists, err := s.rbacRepo.RoleNameExists(ctx, req.Name, nil)
	if err != nil {
		return nil, fmt.Errorf("checking role name: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("role name '%s' already exists", req.Name)
	}

	// Extract permission IDs from source
	permIDs := make([]uuid.UUID, len(source.Permissions))
	for i, p := range source.Permissions {
		permIDs[i] = p.ID
	}

	// Privilege escalation check
	if err := s.checkPrivilegeEscalation(ctx, actorID, permIDs); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	newRole := &model.Role{
		ID:            uuid.New(),
		Name:          req.Name,
		DisplayNameEN: req.DisplayNameEN,
		DisplayNameAR: req.DisplayNameAR,
		Description:   source.Description,
		IsSystem:      false,
		IsActive:      true,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.rbacRepo.CreateRole(ctx, newRole); err != nil {
		return nil, fmt.Errorf("creating cloned role: %w", err)
	}

	if len(permIDs) > 0 {
		if err := s.rbacRepo.AssignPermissionsToRole(ctx, newRole.ID, permIDs); err != nil {
			return nil, fmt.Errorf("assigning cloned permissions: %w", err)
		}
	}

	// Audit log
	s.auditService.LogAction(ctx, "CLONE_ROLE", "role", newRole.ID, nil, map[string]interface{}{
		"source_role": source.Name,
		"new_role":    newRole.Name,
		"permissions": len(permIDs),
	})

	return newRole, nil
}

// UpdateRole updates a custom role's metadata. System roles cannot be modified.
func (s *RBACService) UpdateRole(ctx context.Context, id uuid.UUID, req model.UpdateRoleRequest, actorID uuid.UUID) error {
	existing, err := s.rbacRepo.GetRoleByID(ctx, id)
	if err != nil {
		return fmt.Errorf("getting role: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("role not found")
	}
	if existing.IsSystem {
		return fmt.Errorf("system roles cannot be modified")
	}

	// Check name uniqueness if name changed
	if req.Name != "" && req.Name != existing.Name {
		exists, err := s.rbacRepo.RoleNameExists(ctx, req.Name, &id)
		if err != nil {
			return fmt.Errorf("checking role name: %w", err)
		}
		if exists {
			return fmt.Errorf("role name '%s' already exists", req.Name)
		}
	}

	name := existing.Name
	if req.Name != "" {
		name = req.Name
	}
	displayEN := existing.DisplayNameEN
	if req.DisplayNameEN != "" {
		displayEN = req.DisplayNameEN
	}
	displayAR := existing.DisplayNameAR
	if req.DisplayNameAR != "" {
		displayAR = req.DisplayNameAR
	}
	desc := existing.Description
	if req.Description != nil {
		desc = req.Description
	}

	if err := s.rbacRepo.UpdateRole(ctx, id, name, displayEN, displayAR, desc); err != nil {
		return fmt.Errorf("updating role: %w", err)
	}

	// Audit log
	s.auditService.LogAction(ctx, "UPDATE_ROLE", "role", id,
		map[string]interface{}{"name": existing.Name},
		map[string]interface{}{"name": name},
	)

	return nil
}

// DeactivateRole soft-deactivates a custom role.
func (s *RBACService) DeactivateRole(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	existing, err := s.rbacRepo.GetRoleByID(ctx, id)
	if err != nil {
		return fmt.Errorf("getting role: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("role not found")
	}
	if existing.IsSystem {
		return fmt.Errorf("system roles cannot be deactivated")
	}

	if err := s.rbacRepo.SetRoleActive(ctx, id, false); err != nil {
		return fmt.Errorf("deactivating role: %w", err)
	}

	// Invalidate permission cache for all users with this role
	s.invalidateRoleUsersCache(ctx, id)

	// Audit log
	s.auditService.LogAction(ctx, "DEACTIVATE_ROLE", "role", id, nil, nil)

	return nil
}

// ActivateRole re-activates a previously deactivated role.
func (s *RBACService) ActivateRole(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	if err := s.rbacRepo.SetRoleActive(ctx, id, true); err != nil {
		return fmt.Errorf("activating role: %w", err)
	}

	s.invalidateRoleUsersCache(ctx, id)
	s.auditService.LogAction(ctx, "ACTIVATE_ROLE", "role", id, nil, nil)
	return nil
}

// ── Permission Operations ──

// ListPermissions returns all permissions grouped by domain.
func (s *RBACService) ListPermissions(ctx context.Context) ([]model.PermissionWithGroup, error) {
	return s.rbacRepo.ListPermissions(ctx)
}

// ListPermissionGroups returns all permission groups.
func (s *RBACService) ListPermissionGroups(ctx context.Context) ([]model.PermissionGroup, error) {
	return s.rbacRepo.ListPermissionGroups(ctx)
}

// AssignPermissionsToRole assigns permissions to a role with escalation guard.
func (s *RBACService) AssignPermissionsToRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID, actorID uuid.UUID) error {
	// Check role exists
	role, err := s.rbacRepo.GetRoleByID(ctx, roleID)
	if err != nil || role == nil {
		return fmt.Errorf("role not found")
	}

	// Privilege escalation check
	if err := s.checkPrivilegeEscalation(ctx, actorID, permissionIDs); err != nil {
		return err
	}

	if err := s.rbacRepo.AssignPermissionsToRole(ctx, roleID, permissionIDs); err != nil {
		return fmt.Errorf("assigning permissions: %w", err)
	}

	// Invalidate cache for all users with this role
	s.invalidateRoleUsersCache(ctx, roleID)

	// Audit log
	s.auditService.LogAction(ctx, "ASSIGN_PERMISSIONS", "role", roleID, nil, map[string]interface{}{
		"permission_count": len(permissionIDs),
	})

	return nil
}

// RemovePermissionsFromRole removes permissions from a role.
func (s *RBACService) RemovePermissionsFromRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID, actorID uuid.UUID) error {
	role, err := s.rbacRepo.GetRoleByID(ctx, roleID)
	if err != nil || role == nil {
		return fmt.Errorf("role not found")
	}

	if err := s.rbacRepo.RemovePermissionsFromRole(ctx, roleID, permissionIDs); err != nil {
		return fmt.Errorf("removing permissions: %w", err)
	}

	s.invalidateRoleUsersCache(ctx, roleID)

	s.auditService.LogAction(ctx, "REMOVE_PERMISSIONS", "role", roleID, nil, map[string]interface{}{
		"removed_count": len(permissionIDs),
	})

	return nil
}

// ── Permission Resolution & Caching ──

// GetUserPermissions resolves all permissions for a user and caches them.
func (s *RBACService) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	cacheKey := fmt.Sprintf("user:permissions:%s", userID.String())

	// Try cache first
	cached, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == nil && cached != "" {
		var perms []string
		if err := json.Unmarshal([]byte(cached), &perms); err == nil {
			return perms, nil
		}
	}

	// Cache miss - load from DB
	perms, err := s.rbacRepo.GetUserPermissionStrings(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("loading user permissions: %w", err)
	}

	// Cache for 30 minutes
	data, _ := json.Marshal(perms)
	s.rdb.Set(ctx, cacheKey, string(data), 30*time.Minute)

	return perms, nil
}

// InvalidateUserPermissionCache clears the permission cache for a user.
func (s *RBACService) InvalidateUserPermissionCache(ctx context.Context, userID uuid.UUID) {
	cacheKey := fmt.Sprintf("user:permissions:%s", userID.String())
	s.rdb.Del(ctx, cacheKey)
}

// ── Security Guards ──

// checkPrivilegeEscalation verifies that the actor has all the permissions they are trying to assign.
// Super admins bypass this check.
func (s *RBACService) checkPrivilegeEscalation(ctx context.Context, actorID uuid.UUID, permissionIDs []uuid.UUID) error {
	// Check if actor is super admin
	roles, err := s.userRepo.GetUserRoleNames(ctx, actorID)
	if err != nil {
		return fmt.Errorf("checking actor roles: %w", err)
	}
	for _, r := range roles {
		if r == "super_admin" {
			return nil // Super admin bypasses
		}
	}

	// Get actor's permissions
	actorPerms, err := s.GetUserPermissions(ctx, actorID)
	if err != nil {
		return fmt.Errorf("loading actor permissions: %w", err)
	}
	actorPermSet := make(map[string]bool, len(actorPerms))
	for _, p := range actorPerms {
		actorPermSet[p] = true
	}

	// Get the permissions being assigned
	permsToCheck, err := s.rbacRepo.GetPermissionsByIDs(ctx, permissionIDs)
	if err != nil {
		return fmt.Errorf("loading permissions to check: %w", err)
	}

	for _, p := range permsToCheck {
		permStr := p.Resource + "." + p.Action
		if !actorPermSet[permStr] {
			return fmt.Errorf("privilege escalation denied: you do not have permission '%s'", permStr)
		}
	}

	return nil
}

// invalidateRoleUsersCache clears the permission cache for all users with a given role.
func (s *RBACService) invalidateRoleUsersCache(ctx context.Context, roleID uuid.UUID) {
	// Get all users with this role
	query := `SELECT user_id FROM user_roles WHERE role_id = $1`
	rows, err := s.rbacRepo.Pool().Query(ctx, query, roleID)
	if err != nil {
		s.logger.Error("failed to get role users for cache invalidation", slog.Any("error", err))
		return
	}
	defer rows.Close()

	for rows.Next() {
		var userID uuid.UUID
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		s.InvalidateUserPermissionCache(ctx, userID)
		// Also clear role cache
		s.rdb.Del(ctx, fmt.Sprintf("user:roles:%s", userID.String()))
	}
}
