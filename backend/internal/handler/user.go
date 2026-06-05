package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
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

	resp, err := h.userService.ListUsers(r.Context(), params)
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
