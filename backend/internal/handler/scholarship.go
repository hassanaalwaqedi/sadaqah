package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// ScholarshipHandler handles scholarship-related requests.
type ScholarshipHandler struct {
	service *service.ScholarshipService
}

// NewScholarshipHandler creates a new handler.
func NewScholarshipHandler(svc *service.ScholarshipService) *ScholarshipHandler {
	return &ScholarshipHandler{service: svc}
}

// CreateCycle handles POST /api/v1/scholarships/cycles
func (h *ScholarshipHandler) CreateCycle(w http.ResponseWriter, r *http.Request) {
	var req model.CreateCycleRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	cycle, err := h.service.CreateCycle(r.Context(), req, adminID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create cycle")
		return
	}

	writeJSON(w, http.StatusCreated, cycle)
}

// ListCycles handles GET /api/v1/scholarships/cycles
func (h *ScholarshipHandler) ListCycles(w http.ResponseWriter, r *http.Request) {
	params := parsePagination(r)

	resp, err := h.service.ListCycles(r.Context(), params)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list cycles")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// SubmitApplication handles POST /api/v1/scholarships/cycles/{id}/apply
func (h *ScholarshipHandler) SubmitApplication(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	cycleID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid cycle ID format")
		return
	}

	var req model.CreateApplicationRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	studentID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.service.SubmitApplication(r.Context(), cycleID, studentID, req); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to submit application")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "Application submitted successfully"})
}
