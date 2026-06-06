package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// UserHandler handles user management HTTP requests.
type UserHandler struct {
	userService *service.UserService
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// List handles GET /api/v1/admin/users
func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	params := parsePagination(r)

	// Extract filters
	filters := model.UserFilterParams{
		PaginationParams: params,
		RoleFilter:       r.URL.Query().Get("role"),
		StatusFilter:     r.URL.Query().Get("status"),
	}

	resp, err := h.userService.ListUsersFiltered(r.Context(), filters)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list users")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Get handles GET /api/v1/admin/users/{id}
func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	user, err := h.userService.GetUser(r.Context(), id)
	if err != nil {
		if err == service.ErrUserNotFound {
			writeError(w, r, http.StatusNotFound, "NOT_FOUND", "User not found")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get user")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// AssignRoleRequest is the payload for assigning a role.
type AssignRoleRequest struct {
	Role string `json:"role"`
}

// AssignRole handles POST /api/v1/admin/users/{id}/roles
func (h *UserHandler) AssignRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	var req AssignRoleRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if req.Role == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Role name is required")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.userService.AssignRole(r.Context(), targetUserID, req.Role, adminID); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to assign role")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Role assigned successfully"})
}

// RemoveRole handles DELETE /api/v1/admin/users/{id}/roles/{roleId}
func (h *UserHandler) RemoveRole(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	roleIDStr := chi.URLParam(r, "roleId")
	roleID, err := uuid.Parse(roleIDStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid role ID format")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.userService.RemoveRole(r.Context(), targetUserID, roleID, adminID); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to remove role")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Role removed successfully"})
}

// Deactivate handles DELETE /api/v1/admin/users/{id}
func (h *UserHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	// Prevent self-deactivation
	if targetUserID == adminID {
		writeError(w, r, http.StatusForbidden, "FORBIDDEN", "Cannot deactivate your own account")
		return
	}

	if err := h.userService.DeactivateUser(r.Context(), targetUserID, adminID); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to deactivate user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "User deactivated successfully"})
}

// SuspendUser handles POST /api/v1/admin/users/{id}/suspend
func (h *UserHandler) SuspendUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if targetUserID == adminID {
		writeError(w, r, http.StatusForbidden, "FORBIDDEN", "Cannot suspend your own account")
		return
	}

	var req model.SuspendUserRequest
	_ = parseJSON(r, &req) // reason is optional

	if err := h.userService.SuspendUser(r.Context(), targetUserID, adminID, req.Reason); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to suspend user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "User suspended successfully"})
}

// ReactivateUser handles POST /api/v1/admin/users/{id}/reactivate
func (h *UserHandler) ReactivateUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.userService.ReactivateUser(r.Context(), targetUserID, adminID); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to reactivate user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "User reactivated successfully"})
}

// GetLoginHistory handles GET /api/v1/admin/users/{id}/login-history
func (h *UserHandler) GetLoginHistory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	history, err := h.userService.GetLoginHistory(r.Context(), userID, 50)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get login history")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{
		Message: "Login history retrieved",
		Data:    history,
	})
}

// GetUserActivity handles GET /api/v1/admin/users/{id}/activity
func (h *UserHandler) GetUserActivity(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	activity, err := h.userService.GetUserActivity(r.Context(), userID, 50)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get user activity")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{
		Message: "User activity retrieved",
		Data:    activity,
	})
}

// ForceLogout handles POST /api/v1/admin/users/{id}/force-logout
func (h *UserHandler) ForceLogout(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.userService.ForceLogout(r.Context(), targetUserID, adminID); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to force logout")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "User force-logged out successfully"})
}

