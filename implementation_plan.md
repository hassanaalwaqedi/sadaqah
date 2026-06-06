# Enterprise RBAC & Administrative Management System

## Background & Current State Audit

The Sadaqah Platform is a Go/Chi backend + Next.js frontend application with **partial RBAC already in place**:

### ✅ What Already Exists
| Component | Status | Details |
|---|---|---|
| `roles` table | ✅ Exists | 9 system roles seeded (super_admin, admin, scholarship_admin, housing_admin, student, judge, donor, researcher, auditor) |
| `permissions` table | ✅ Exists | ~35 permissions seeded with `resource.action` pattern |
| `role_permissions` table | ✅ Exists | Junction table with seeds mapping roles to permissions |
| `user_roles` table | ✅ Exists | Many-to-many with `assigned_by` tracking |
| `audit_logs` table | ✅ Exists | Basic audit logging (user_id, action, entity_type, entity_id, old/new values, IP, user_agent) |
| JWT auth with roles in claims | ✅ Exists | [auth.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/middleware/auth.go) stores roles in JWT claims |
| `RequireRoles()` middleware | ✅ Exists | Role-based (not permission-based) authorization middleware |
| Frontend `hasRole()`/`hasAnyRole()` | ✅ Exists | [auth-provider.tsx](file:///c:/Users/Hassan/Sadaqah/frontend/src/providers/auth-provider.tsx) |
| Sidebar role filtering | ✅ Exists | [sidebar.tsx](file:///c:/Users/Hassan/Sadaqah/frontend/src/components/layout/sidebar.tsx) filters nav by roles |
| Role assignment API | ✅ Exists | [user.go handler](file:///c:/Users/Hassan/Sadaqah/backend/internal/handler/user.go) |

### ❌ What's Missing (Gaps to Fill)
| Component | Gap |
|---|---|
| **Permission-based middleware** | `RequirePermission("users.read")` does NOT exist — only `RequireRoles("super_admin", "admin")` is used |
| **Permission groups** | No `permission_groups` table for organizing permissions |
| **Admin activity logs** | Audit logs exist but are basic — missing request_id, success/failure tracking |
| **3 missing default roles** | Organization Admin, Innovation Manager, Volunteer, Guest, System Service Account not seeded |
| **~15 missing permissions** | `roles.read`, `roles.create`, `roles.update`, `roles.assign`, `scholarships.approve`, `housing.assign`, `housing.manage`, `innovation.review`, `innovation.score`, `finance.write`, `finance.audit`, `donations.manage`, `reports.generate`, `notifications.send`, `system.settings`, `system.monitor`, `system.backup`, `ai.manage`, `files.manage` |
| **Custom role CRUD APIs** | No endpoints for creating/cloning/deactivating roles |
| **Permission management APIs** | No endpoints for viewing/assigning permissions to roles |
| **Privilege escalation guards** | No checks preventing users from assigning roles higher than their own |
| **JWT permissions claim** | JWT only contains role names, not resolved permissions |
| **Frontend permission checking** | Frontend only checks roles, not granular permissions |
| **Admin dashboard pages** | Only basic user list exists under `/portal/admin/users` — missing Role Management, Permission Management, Audit Logs UI, System Monitoring |
| **User management features** | Missing: suspend/reactivate, force logout, reset password, view login history |

---

## User Review Required

> [!IMPORTANT]
> **JWT Size vs. Performance Tradeoff**: Including all permissions in the JWT token will increase token size significantly (~2KB for 40+ permissions). The alternative is to load permissions from Redis on each request. **Recommendation: Store only role names in JWT (as today), resolve permissions via Redis cache on each request.** This avoids token bloat and allows real-time permission updates without requiring re-login. Please confirm.

> [!IMPORTANT]
> **Admin Dashboard Scope**: The task lists 17+ admin dashboard sections. For the initial RBAC implementation, I recommend building the **core infrastructure** (Phases 1-5) with these admin UI pages: Overview, User Management, Role Management, Permission Management, Audit Logs, and System Monitoring. The remaining domain-specific admin pages (Scholarships, Housing, Innovation, etc.) already have their own pages in the portal. Please confirm this scope.

> [!WARNING]
> **Database Migration on Production**: Phase 1 adds new columns and tables. If this is running in production, the migration should be run during a maintenance window. The migration is designed to be non-destructive (additive only).

## Open Questions

1. **Super Admin bootstrap**: How should the first Super Admin be created? Via a CLI command, a seed migration, or a protected API endpoint?
2. **Session management**: Should "force logout" revoke all sessions globally (Redis blacklist all tokens), or per-device?
3. **Audit log retention**: Should there be a retention policy (e.g., 2 years), or keep everything indefinitely?

---

## Proposed Changes

### Phase 1: Database Schema Extensions

#### [NEW] [008_rbac_extensions.up.sql](file:///c:/Users/Hassan/Sadaqah/backend/migrations/008_rbac_extensions.up.sql)

New migration that:
- Adds `permission_groups` table (id, name, description, sort_order) for organizing permissions by domain
- Adds `group_id` FK column to `permissions` table
- Adds `is_active` and `updated_at` columns to `roles` table for role deactivation
- Enhances `audit_logs` table with `request_id` (VARCHAR), `success` (BOOLEAN), `target_user_id` (UUID) columns
- Seeds missing roles: `org_admin`, `innovation_manager`, `financial_officer`, `support_employee`, `volunteer`, `guest`, `system_service`
- Seeds missing permissions (~20 new permissions covering roles.*, housing.assign/manage, innovation.review/score, finance.write, donations.manage, reports.generate, notifications.send, system.*, ai.manage, files.manage)
- Seeds permission_groups (Users & Roles, Scholarships, Housing, Innovation, Finance, Reports, System)
- Maps all new permissions to appropriate roles
- Assigns all permissions to super_admin via a cross join

#### [NEW] [008_rbac_extensions.down.sql](file:///c:/Users/Hassan/Sadaqah/backend/migrations/008_rbac_extensions.down.sql)

Rollback migration.

---

### Phase 2: Backend Permission Infrastructure

#### [MODIFY] [user.go (model)](file:///c:/Users/Hassan/Sadaqah/backend/internal/model/user.go)

- Add `PermissionGroup` struct
- Add `IsActive` and `UpdatedAt` fields to `Role` struct
- Add `RoleWithPermissions` struct (for admin API responses)

#### [MODIFY] [audit.go (model)](file:///c:/Users/Hassan/Sadaqah/backend/internal/model/audit.go)

- Add `RequestID`, `Success`, `TargetUserID` fields to `AuditLog` and `AuditLogCreate`

#### [MODIFY] [dto.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/model/dto.go)

- Add `CreateRoleRequest`, `UpdateRoleRequest`, `CloneRoleRequest`, `AssignPermissionsRequest`
- Add `SuspendUserRequest`, `UserFilterParams` (extends PaginationParams with role/status filters)
- Add `AdminUserResponse` (includes login history, activity, profile completeness)

#### [MODIFY] [auth.go (middleware)](file:///c:/Users/Hassan/Sadaqah/backend/internal/middleware/auth.go)

- Add `UserPermissionsKey` context key
- Add `RequirePermission(permissions ...string)` middleware function that:
  1. Gets user ID from context
  2. Loads user permissions from Redis cache (key: `user:permissions:{userID}`)
  3. If cache miss, loads from DB and caches for 30 minutes
  4. Checks if user has ANY of the required permissions
  5. Super admin bypass (has all permissions)
- Add `GetUserPermissions(ctx)` helper to extract permissions from context
- **Keep existing `RequireRoles()` intact** for backward compatibility

#### [NEW] [rbac_service.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/service/rbac_service.go)

New service containing:
- `GetAllRoles(ctx)` - list all roles with permission counts
- `GetRoleByID(ctx, id)` - get role with full permissions
- `CreateRole(ctx, req)` - create custom role with privilege escalation check
- `CloneRole(ctx, sourceID, newName)` - duplicate a role's permissions
- `UpdateRole(ctx, id, req)` - rename/update role (prevent modifying system roles)
- `DeactivateRole(ctx, id)` - soft-deactivate (prevent deactivating system roles)
- `AssignPermissionsToRole(ctx, roleID, permissionIDs)` - with escalation guard
- `RemovePermissionsFromRole(ctx, roleID, permissionIDs)`
- `GetAllPermissions(ctx)` - list all permissions grouped
- `GetUserPermissions(ctx, userID)` - resolve all permissions for a user (union of all role permissions)
- `InvalidateUserPermissionCache(ctx, userID)` - clear Redis cache when roles/permissions change
- **Privilege escalation guard**: A user cannot assign a permission they don't have themselves

#### [NEW] [rbac_repo.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/repository/rbac_repo.go)

New repository containing:
- `ListRoles(ctx, includeInactive)` - with permission counts via subquery
- `GetRoleByID(ctx, id)` - with joined permissions
- `CreateRole(ctx, role)` - insert
- `UpdateRole(ctx, id, updates)` - update name/description/active status
- `ListPermissions(ctx)` - with group information
- `GetPermissionsByRoleID(ctx, roleID)` - permissions for a specific role
- `GetUserPermissionStrings(ctx, userID)` - returns `[]string` like `["users.read", "finance.write"]`
- `AssignPermissionsToRole(ctx, roleID, permissionIDs)` - batch insert
- `RemovePermissionsFromRole(ctx, roleID, permissionIDs)` - batch delete
- `RoleHasUsers(ctx, roleID)` - check before deactivation

#### [MODIFY] [user_repo.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/repository/user_repo.go)

- Add `RemoveRole(ctx, userID, roleID)` - delete from user_roles
- Add `ListWithFilters(ctx, filters)` - support filtering by role, status, search
- Add `SuspendUser(ctx, userID)` - set is_active=false (distinct from soft delete)
- Add `ReactivateUser(ctx, userID)` - set is_active=true
- Add `GetLoginHistory(ctx, userID, limit)` - query login_attempts for a user
- Add `GetUserActivity(ctx, userID, limit)` - query audit_logs for a user

#### [MODIFY] [audit_repo.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/repository/audit_repo.go)

- Update `Log()` to include request_id, success, target_user_id
- Add `GetLogsByUser(ctx, userID, params)` for user-specific audit trail
- Add filtering to `GetLogs()` (by action, entity_type, user_id, date range)

#### [MODIFY] [audit_service.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/service/audit_service.go)

- Extend `LogAction()` signature to include request_id, success, target_user_id
- Add `LogAdminAction()` convenience method for admin operations

---

### Phase 3: API Endpoints & Router Refactoring

#### [NEW] [rbac_handler.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/handler/rbac_handler.go)

New handler containing:
- `GET /api/v1/admin/roles` → ListRoles (requires `roles.read`)
- `GET /api/v1/admin/roles/{id}` → GetRole with permissions (requires `roles.read`)
- `POST /api/v1/admin/roles` → CreateRole (requires `roles.create`)
- `PUT /api/v1/admin/roles/{id}` → UpdateRole (requires `roles.update`)
- `POST /api/v1/admin/roles/{id}/clone` → CloneRole (requires `roles.create`)
- `DELETE /api/v1/admin/roles/{id}` → DeactivateRole (requires `roles.update`)
- `PUT /api/v1/admin/roles/{id}/permissions` → AssignPermissions (requires `roles.assign`)
- `GET /api/v1/admin/permissions` → ListPermissions (requires `roles.read`)
- `GET /api/v1/admin/permissions/groups` → ListPermissionGroups (requires `roles.read`)

#### [MODIFY] [user.go (handler)](file:///c:/Users/Hassan/Sadaqah/backend/internal/handler/user.go)

- Extend `List` to support filters (role, status, search)
- Add `SuspendUser` handler (POST /admin/users/{id}/suspend)
- Add `ReactivateUser` handler (POST /admin/users/{id}/reactivate)
- Add `RemoveRole` handler (DELETE /admin/users/{id}/roles/{roleId})
- Add `GetLoginHistory` handler (GET /admin/users/{id}/login-history)
- Add `GetUserActivity` handler (GET /admin/users/{id}/activity)
- Add `ForceLogout` handler (POST /admin/users/{id}/force-logout)
- Add `ResetPassword` handler (POST /admin/users/{id}/reset-password)
- Extend `AssignRole` to support multiple roles and privilege escalation check

#### [MODIFY] [user_service.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/service/user_service.go)

- Add `SuspendUser`, `ReactivateUser`, `RemoveRole`, `ForceLogout`, `AdminResetPassword`, `GetLoginHistory`, `GetUserActivity`
- Add privilege escalation checks for role assignment

#### [MODIFY] [router.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/router/router.go)

- Wire new `rbacService` and `rbacHandler`
- Add new admin routes under `/api/v1/admin/`
- **Gradually replace** `RequireRoles()` with `RequirePermission()` on existing routes:
  - `POST /scholarships/cycles` → `RequirePermission("scholarships.create")` (was `RequireRoles("super_admin", "admin", "scholarship_admin")`)
  - `POST /housing/allocate` → `RequirePermission("housing.allocate")` (was `RequireRoles("super_admin", "admin")`)
  - `POST /innovation/events` → `RequirePermission("innovation.create")` (was `RequireRoles("super_admin", "admin")`)
  - `GET /finance/budgets` → `RequirePermission("finance.read")` (was `RequireRoles("super_admin", "admin", "auditor")`)
  - `POST /finance/expenses/disburse` → `RequirePermission("finance.approve")` (was `RequireRoles("super_admin", "admin")`)
  - `/reports/*` → `RequirePermission("reports.read")` (was `RequireRoles("super_admin", "admin", "auditor")`)
  - `/evaluations/*` → `RequirePermission("scholarships.evaluate")` (was `RequireRoles("judge", "super_admin")`)
  - `/admin/*` → `RequirePermission("admin.access")`
- **Keep `RequireRoles()` as fallback** where backward compatibility is critical

---

### Phase 4: Frontend Permission Infrastructure

#### [MODIFY] [auth-provider.tsx](file:///c:/Users/Hassan/Sadaqah/frontend/src/providers/auth-provider.tsx)

- Add `permissions` to User interface (loaded from `/users/me` response)
- Add `hasPermission(permission: string): boolean` method
- Add `hasAnyPermission(...permissions: string[]): boolean` method
- Keep existing `hasRole()`/`hasAnyRole()` for backward compatibility
- Permissions are resolved server-side and returned with the user object

#### [MODIFY] [sidebar.tsx](file:///c:/Users/Hassan/Sadaqah/frontend/src/components/layout/sidebar.tsx)

- Extend navigation items to support `permissions` array alongside `roles`
- Add new admin sections: Role Management, Audit Logs, System Monitoring
- Items are shown if user has ANY of the listed roles OR permissions

#### [NEW] [use-permissions.ts](file:///c:/Users/Hassan/Sadaqah/frontend/src/lib/use-permissions.ts)

Custom hook:
- `usePermissions()` → returns `{ hasPermission, hasAnyPermission, permissions }`
- `PermissionGate` component → renders children only if user has required permission
- `withPermission(Component, permission)` → HOC for route-level protection

---

### Phase 5: Admin Dashboard UI Pages

All pages under `/portal/admin/` with premium dark-mode design matching existing portal aesthetics.

#### [NEW] `/portal/admin/roles/page.tsx`
- List all roles with permission counts, user counts, system/custom badge
- Create new role modal with name (EN/AR), description
- Clone role action
- Deactivate/reactivate toggle for custom roles
- System roles shown but not editable

#### [NEW] `/portal/admin/roles/[id]/page.tsx`
- Role detail view showing all assigned permissions grouped by category
- Toggle permissions on/off with live save
- User list showing all users with this role
- Audit trail for role changes

#### [NEW] `/portal/admin/audit/page.tsx`
- Searchable, filterable audit log viewer
- Filter by: action type, user, entity type, date range, success/failure
- Expandable rows showing old/new values diff
- Export to CSV

#### [MODIFY] `/portal/admin/users/page.tsx`
- Enhance with: role filter chips, status filter (active/suspended/all)
- Add suspend/reactivate/force-logout action buttons
- Role assignment modal with multi-select
- Expandable user row with login history and activity

#### [NEW] `/portal/admin/overview/page.tsx`
- Admin overview dashboard with:
  - Total users, active users, new users (30 days)
  - Users by role distribution chart
  - Recent admin activity feed
  - System health indicators

---

### Phase 6: Testing

#### [NEW] [rbac_test.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/middleware/rbac_test.go)
- Test `RequirePermission()` middleware: allow, deny, super admin bypass, multiple permissions
- Test permission cache hit/miss scenarios

#### [NEW] [rbac_service_test.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/service/rbac_service_test.go)
- Test role CRUD, permission assignment
- Test privilege escalation prevention
- Test permission resolution (multi-role union)

#### [NEW] [rbac_handler_test.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/handler/rbac_handler_test.go)
- Integration tests for all admin RBAC endpoints
- Test access denial for unauthorized users

#### [MODIFY] [helpers_test.go](file:///c:/Users/Hassan/Sadaqah/backend/internal/handler/helpers_test.go)
- Add test helpers for creating users with specific permissions

---

### Phase 7: Documentation

#### [NEW] RBAC Architecture Document
- Generated as artifact: permission matrix, role hierarchy, middleware flow diagram
- Default role-permission matrix table
- Administrative workflow documentation
- Migration notes

---

## Verification Plan

### Automated Tests
```bash
# Run all backend tests
cd backend && go test ./internal/...

# Run specific RBAC tests
cd backend && go test ./internal/middleware/ -run TestRequirePermission -v
cd backend && go test ./internal/service/ -run TestRBAC -v
```

### Manual Verification
1. **Backward compatibility**: Existing login/register/logout flows continue working
2. **Permission middleware**: Create a test user with specific permissions, verify access control
3. **Admin UI**: Navigate admin pages as super_admin vs. limited admin vs. student
4. **Privilege escalation**: Verify a non-super-admin cannot assign super_admin role
5. **Audit logging**: Verify all admin actions appear in audit logs with correct metadata
6. **Cache invalidation**: Assign new role to user → verify permissions update without re-login
7. **Frontend gating**: Verify sidebar items and page access respect permissions
