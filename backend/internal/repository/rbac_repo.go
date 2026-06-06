package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

// RBACRepository handles role and permission data access.
type RBACRepository struct {
	pool *pgxpool.Pool
}

// NewRBACRepository creates a new RBACRepository.
func NewRBACRepository(pool *pgxpool.Pool) *RBACRepository {
	return &RBACRepository{pool: pool}
}

// Pool returns the underlying connection pool for ad-hoc queries.
func (r *RBACRepository) Pool() *pgxpool.Pool {
	return r.pool
}

// ── Roles ──

// ListRoles returns all roles with permission and user counts.
func (r *RBACRepository) ListRoles(ctx context.Context, includeInactive bool) ([]model.RoleWithCounts, error) {
	query := `
		SELECT r.id, r.name, r.display_name_en, r.display_name_ar, r.description,
		       r.is_system, r.is_active, r.created_at, r.updated_at,
		       COALESCE(pc.perm_count, 0) AS permission_count,
		       COALESCE(uc.user_count, 0) AS user_count
		FROM roles r
		LEFT JOIN (
			SELECT role_id, COUNT(*) AS perm_count FROM role_permissions GROUP BY role_id
		) pc ON pc.role_id = r.id
		LEFT JOIN (
			SELECT role_id, COUNT(*) AS user_count FROM user_roles GROUP BY role_id
		) uc ON uc.role_id = r.id`

	if !includeInactive {
		query += ` WHERE r.is_active = true`
	}
	query += ` ORDER BY r.is_system DESC, r.created_at ASC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing roles: %w", err)
	}
	defer rows.Close()

	var roles []model.RoleWithCounts
	for rows.Next() {
		var role model.RoleWithCounts
		if err := rows.Scan(
			&role.ID, &role.Name, &role.DisplayNameEN, &role.DisplayNameAR,
			&role.Description, &role.IsSystem, &role.IsActive,
			&role.CreatedAt, &role.UpdatedAt,
			&role.PermissionCount, &role.UserCount,
		); err != nil {
			return nil, fmt.Errorf("scanning role: %w", err)
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// GetRoleByID retrieves a role with its permissions.
func (r *RBACRepository) GetRoleByID(ctx context.Context, id uuid.UUID) (*model.RoleWithPermissions, error) {
	query := `
		SELECT id, name, display_name_en, display_name_ar, description,
		       is_system, is_active, created_at, updated_at
		FROM roles WHERE id = $1`

	role := &model.RoleWithPermissions{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&role.ID, &role.Name, &role.DisplayNameEN, &role.DisplayNameAR,
		&role.Description, &role.IsSystem, &role.IsActive,
		&role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("querying role: %w", err)
	}

	// Fetch permissions for this role
	perms, err := r.GetPermissionsByRoleID(ctx, id)
	if err != nil {
		return nil, err
	}
	role.Permissions = perms

	return role, nil
}

// CreateRole inserts a new role.
func (r *RBACRepository) CreateRole(ctx context.Context, role *model.Role) error {
	query := `
		INSERT INTO roles (id, name, display_name_en, display_name_ar, description, is_system, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.pool.Exec(ctx, query,
		role.ID, role.Name, role.DisplayNameEN, role.DisplayNameAR,
		role.Description, role.IsSystem, role.IsActive,
		role.CreatedAt, role.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting role: %w", err)
	}
	return nil
}

// UpdateRole updates a role's mutable fields.
func (r *RBACRepository) UpdateRole(ctx context.Context, id uuid.UUID, name, displayEN, displayAR string, description *string) error {
	query := `
		UPDATE roles SET name = $2, display_name_en = $3, display_name_ar = $4,
		                 description = $5, updated_at = $6
		WHERE id = $1 AND is_system = false`

	_, err := r.pool.Exec(ctx, query, id, name, displayEN, displayAR, description, time.Now().UTC())
	if err != nil {
		return fmt.Errorf("updating role: %w", err)
	}
	return nil
}

// SetRoleActive activates or deactivates a role.
func (r *RBACRepository) SetRoleActive(ctx context.Context, id uuid.UUID, active bool) error {
	query := `UPDATE roles SET is_active = $2, updated_at = $3 WHERE id = $1 AND is_system = false`
	_, err := r.pool.Exec(ctx, query, id, active, time.Now().UTC())
	return err
}

// RoleHasUsers checks if any users are assigned to this role.
func (r *RBACRepository) RoleHasUsers(ctx context.Context, roleID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM user_roles WHERE role_id = $1)`
	var exists bool
	err := r.pool.QueryRow(ctx, query, roleID).Scan(&exists)
	return exists, err
}

// RoleNameExists checks if a role name is already taken.
func (r *RBACRepository) RoleNameExists(ctx context.Context, name string, excludeID *uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM roles WHERE name = $1`
	args := []interface{}{name}
	if excludeID != nil {
		query += ` AND id != $2`
		args = append(args, *excludeID)
	}
	query += `)`

	var exists bool
	err := r.pool.QueryRow(ctx, query, args...).Scan(&exists)
	return exists, err
}

// ── Permissions ──

// ListPermissions returns all permissions grouped by their group.
func (r *RBACRepository) ListPermissions(ctx context.Context) ([]model.PermissionWithGroup, error) {
	query := `
		SELECT p.id, p.resource, p.action, p.description, p.group_id,
		       COALESCE(pg.name, 'ungrouped') AS group_name
		FROM permissions p
		LEFT JOIN permission_groups pg ON pg.id = p.group_id
		ORDER BY pg.sort_order ASC NULLS LAST, p.resource ASC, p.action ASC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing permissions: %w", err)
	}
	defer rows.Close()

	var perms []model.PermissionWithGroup
	for rows.Next() {
		var p model.PermissionWithGroup
		if err := rows.Scan(&p.ID, &p.Resource, &p.Action, &p.Description, &p.GroupID, &p.GroupName); err != nil {
			return nil, fmt.Errorf("scanning permission: %w", err)
		}
		perms = append(perms, p)
	}
	return perms, nil
}

// ListPermissionGroups returns all permission groups.
func (r *RBACRepository) ListPermissionGroups(ctx context.Context) ([]model.PermissionGroup, error) {
	query := `SELECT id, name, description, sort_order, created_at FROM permission_groups ORDER BY sort_order ASC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing permission groups: %w", err)
	}
	defer rows.Close()

	var groups []model.PermissionGroup
	for rows.Next() {
		var g model.PermissionGroup
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.SortOrder, &g.CreatedAt); err != nil {
			return nil, fmt.Errorf("scanning permission group: %w", err)
		}
		groups = append(groups, g)
	}
	return groups, nil
}

// GetPermissionsByRoleID returns all permissions assigned to a role.
func (r *RBACRepository) GetPermissionsByRoleID(ctx context.Context, roleID uuid.UUID) ([]model.Permission, error) {
	query := `
		SELECT p.id, p.resource, p.action, p.description
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = $1
		ORDER BY p.resource, p.action`

	rows, err := r.pool.Query(ctx, query, roleID)
	if err != nil {
		return nil, fmt.Errorf("querying permissions by role: %w", err)
	}
	defer rows.Close()

	var perms []model.Permission
	for rows.Next() {
		var p model.Permission
		if err := rows.Scan(&p.ID, &p.Resource, &p.Action, &p.Description); err != nil {
			return nil, fmt.Errorf("scanning permission: %w", err)
		}
		perms = append(perms, p)
	}
	return perms, nil
}

// GetUserPermissionStrings returns all permissions for a user as "resource.action" strings.
// This resolves the union of permissions across all roles assigned to the user.
func (r *RBACRepository) GetUserPermissionStrings(ctx context.Context, userID uuid.UUID) ([]string, error) {
	query := `
		SELECT DISTINCT p.resource || '.' || p.action AS perm
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		JOIN user_roles ur ON ur.role_id = rp.role_id
		JOIN roles rl ON rl.id = ur.role_id AND rl.is_active = true
		WHERE ur.user_id = $1
		ORDER BY perm`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("querying user permissions: %w", err)
	}
	defer rows.Close()

	var perms []string
	for rows.Next() {
		var perm string
		if err := rows.Scan(&perm); err != nil {
			return nil, fmt.Errorf("scanning permission string: %w", err)
		}
		perms = append(perms, perm)
	}
	return perms, nil
}

// AssignPermissionsToRole batch-inserts permissions for a role.
func (r *RBACRepository) AssignPermissionsToRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	if len(permissionIDs) == 0 {
		return nil
	}

	// Build batch insert
	values := make([]string, len(permissionIDs))
	args := make([]interface{}, 0, len(permissionIDs)+1)
	args = append(args, roleID)

	for i, pid := range permissionIDs {
		values[i] = fmt.Sprintf("($1, $%d)", i+2)
		args = append(args, pid)
	}

	query := fmt.Sprintf(
		`INSERT INTO role_permissions (role_id, permission_id) VALUES %s ON CONFLICT (role_id, permission_id) DO NOTHING`,
		strings.Join(values, ", "),
	)

	_, err := r.pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("assigning permissions to role: %w", err)
	}
	return nil
}

// RemovePermissionsFromRole removes specific permissions from a role.
func (r *RBACRepository) RemovePermissionsFromRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	if len(permissionIDs) == 0 {
		return nil
	}

	placeholders := make([]string, len(permissionIDs))
	args := make([]interface{}, 0, len(permissionIDs)+1)
	args = append(args, roleID)

	for i, pid := range permissionIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+2)
		args = append(args, pid)
	}

	query := fmt.Sprintf(
		`DELETE FROM role_permissions WHERE role_id = $1 AND permission_id IN (%s)`,
		strings.Join(placeholders, ", "),
	)

	_, err := r.pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("removing permissions from role: %w", err)
	}
	return nil
}

// SetRolePermissions replaces all permissions for a role (used for full replacement).
func (r *RBACRepository) SetRolePermissions(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delete existing
	_, err = tx.Exec(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, roleID)
	if err != nil {
		return fmt.Errorf("clearing role permissions: %w", err)
	}

	// Insert new
	for _, pid := range permissionIDs {
		_, err = tx.Exec(ctx,
			`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
			roleID, pid,
		)
		if err != nil {
			return fmt.Errorf("inserting role permission: %w", err)
		}
	}

	return tx.Commit(ctx)
}

// GetPermissionsByIDs retrieves permissions by their IDs.
func (r *RBACRepository) GetPermissionsByIDs(ctx context.Context, ids []uuid.UUID) ([]model.Permission, error) {
	if len(ids) == 0 {
		return nil, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(
		`SELECT id, resource, action, description FROM permissions WHERE id IN (%s)`,
		strings.Join(placeholders, ", "),
	)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("querying permissions by IDs: %w", err)
	}
	defer rows.Close()

	var perms []model.Permission
	for rows.Next() {
		var p model.Permission
		if err := rows.Scan(&p.ID, &p.Resource, &p.Action, &p.Description); err != nil {
			return nil, fmt.Errorf("scanning permission: %w", err)
		}
		perms = append(perms, p)
	}
	return perms, nil
}
