package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// RBACHandler handles role and permission management HTTP requests.
type RBACHandler struct {
	rbacService *service.RBACService
}

// NewRBACHandler creates a new RBACHandler.
func NewRBACHandler(rbacService *service.RBACService) *RBACHandler {
	return &RBACHandler{rbacService: rbacService}
}

// ListRoles handles GET /api/v1/admin/roles
func (h *RBACHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	includeInactive := r.URL.Query().Get("include_inactive") == "true"

	roles, err := h.rbacService.ListRoles(r.Context(), includeInactive)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list roles")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{
		Message: "Roles retrieved successfully",
		Data:    roles,
	})
}

// GetRole handles GET /api/v1/admin/roles/{id}
func (h *RBACHandler) GetRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	role, err := h.rbacService.GetRole(r.Context(), id)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Role not found")
		return
	}

	writeJSON(w, http.StatusOK, role)
}

// CreateRole handles POST /api/v1/admin/roles
func (h *RBACHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var req model.CreateRoleRequest
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	actorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	role, err := h.rbacService.CreateRole(r.Context(), req, actorID)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, model.SuccessResponse{
		Message: "Role created successfully",
		Data:    role,
	})
}

// UpdateRole handles PUT /api/v1/admin/roles/{id}
func (h *RBACHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	var req model.UpdateRoleRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	actorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.rbacService.UpdateRole(r.Context(), id, req, actorID); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Role updated successfully"})
}

// CloneRole handles POST /api/v1/admin/roles/{id}/clone
func (h *RBACHandler) CloneRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	sourceID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	var req model.CloneRoleRequest
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	actorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	role, err := h.rbacService.CloneRole(r.Context(), sourceID, req, actorID)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, model.SuccessResponse{
		Message: "Role cloned successfully",
		Data:    role,
	})
}

// DeactivateRole handles DELETE /api/v1/admin/roles/{id}
func (h *RBACHandler) DeactivateRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	actorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.rbacService.DeactivateRole(r.Context(), id, actorID); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Role deactivated successfully"})
}

// AssignPermissions handles PUT /api/v1/admin/roles/{id}/permissions
func (h *RBACHandler) AssignPermissions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	roleID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	var req model.AssignPermissionsRequest
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	actorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.rbacService.AssignPermissionsToRole(r.Context(), roleID, req.PermissionIDs, actorID); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Permissions assigned successfully"})
}

// RemovePermissions handles DELETE /api/v1/admin/roles/{id}/permissions
func (h *RBACHandler) RemovePermissions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	roleID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	var req model.RemovePermissionsRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	actorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.rbacService.RemovePermissionsFromRole(r.Context(), roleID, req.PermissionIDs, actorID); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Permissions removed successfully"})
}

// ListPermissions handles GET /api/v1/admin/permissions
func (h *RBACHandler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	perms, err := h.rbacService.ListPermissions(r.Context())
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list permissions")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{
		Message: "Permissions retrieved successfully",
		Data:    perms,
	})
}

// ListPermissionGroups handles GET /api/v1/admin/permissions/groups
func (h *RBACHandler) ListPermissionGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.rbacService.ListPermissionGroups(r.Context())
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list permission groups")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{
		Message: "Permission groups retrieved successfully",
		Data:    groups,
	})
}
