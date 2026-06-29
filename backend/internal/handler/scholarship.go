package handler

import (
	"encoding/json"
	"fmt"
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
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body: " + err.Error())
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	cycle, err := h.service.CreateCycle(r.Context(), req, adminID)
	if err != nil {
		fmt.Printf("CreateCycle error: %v\n", err)
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create cycle")
		return
	}

	writeJSON(w, http.StatusCreated, cycle)
}

// ListCycles handles GET /api/v1/scholarships/cycles
func (h *ScholarshipHandler) ListCycles(w http.ResponseWriter, r *http.Request) {
	params := parsePagination(r)
	statusFilter := r.URL.Query().Get("status")

	userRoles := middleware.GetUserRoles(r.Context())
	isAdmin := false
	for _, role := range userRoles {
		if role == "super_admin" || role == "admin" || role == "scholarship_admin" || role == "scholarship_manager" {
			isAdmin = true
			break
		}
	}

	if !isAdmin {
		statusFilter = "open"
	}

	resp, err := h.service.ListCycles(r.Context(), params, statusFilter)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list cycles")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetCycle handles GET /api/v1/scholarships/cycles/{id}
func (h *ScholarshipHandler) GetCycle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	cycleID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid cycle ID format")
		return
	}

	cycle, err := h.service.GetCycleByID(r.Context(), cycleID)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Cycle not found")
		return
	}

	writeJSON(w, http.StatusOK, cycle)
}

// UpdateCycle handles PUT /api/v1/scholarships/cycles/{id}
func (h *ScholarshipHandler) UpdateCycle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	cycleID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid cycle ID format")
		return
	}

	var req model.UpdateCycleRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	cycle, err := h.service.UpdateCycle(r.Context(), cycleID, req)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update cycle")
		return
	}

	writeJSON(w, http.StatusOK, cycle)
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

// GetCertificateData handles GET /api/v1/scholarships/applications/{id}/certificate
func (h *ScholarshipHandler) GetCertificateData(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	
	data, err := h.service.GetCertificateData(r.Context(), idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, data)
}

// GetMyApplication handles GET /api/v1/scholarships/cycles/{id}/apply
func (h *ScholarshipHandler) GetMyApplication(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	cycleID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid cycle ID format")
		return
	}

	studentID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	app, err := h.service.GetMyApplication(r.Context(), cycleID, studentID)
	if err != nil {
		// Not found is fine, return empty or 404
		writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Application not found")
		return
	}

	writeJSON(w, http.StatusOK, app)
}

// GetMyApplications handles GET /api/v1/scholarships/applications/my
func (h *ScholarshipHandler) GetMyApplications(w http.ResponseWriter, r *http.Request) {
	studentID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	apps, err := h.service.GetMyApplications(r.Context(), studentID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get applications")
		return
	}

	if apps == nil {
		apps = []model.ScholarshipApplication{}
	}

	writeJSON(w, http.StatusOK, apps)
}

// GetApplicationsByCycle handles GET /api/v1/scholarships/cycles/{id}/applications
func (h *ScholarshipHandler) GetApplicationsByCycle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	
	apps, err := h.service.GetApplicationsByCycle(r.Context(), idStr)
	if err != nil {
		fmt.Printf("GetApplicationsByCycle error: %v\n", err)
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get applications")
		return
	}

	if apps == nil {
		apps = []model.ScholarshipApplication{}
	}

	writeJSON(w, http.StatusOK, apps)
}

// GetApplicationDetails handles GET /api/v1/scholarships/applications/{appId}
func (h *ScholarshipHandler) GetApplicationDetails(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "appId")

	app, err := h.service.GetApplicationDetails(r.Context(), appIDStr)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Application not found")
		return
	}

	cycle, _ := h.service.GetCycleByID(r.Context(), app.CycleID)
	timeline, _ := h.service.GetApplicationTimeline(r.Context(), appIDStr)
	
	// Assume an admin is calling if they reach this handler
	messages, _ := h.service.GetApplicationMessages(r.Context(), appIDStr, true)

	submitter, _ := h.service.GetApplicantProfile(r.Context(), app.ApplicantID)
	evaluations, _ := h.service.GetApplicationEvaluations(r.Context(), appIDStr)

	resp := map[string]interface{}{
		"application": app,
		"cycle":       cycle,
		"submitter":   submitter,
		"timeline":    timeline,
		"messages":    messages,
		"evaluations": evaluations,
	}
	writeJSON(w, http.StatusOK, resp)
}

// UpdateApplicationStatus handles PUT /api/v1/scholarships/applications/{appId}/status
func (h *ScholarshipHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "appId")

	var req struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid body")
		return
	}

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.service.UpdateApplicationStatus(r.Context(), appIDStr, req.Status, req.Reason, userID); err != nil {
		fmt.Printf("UpdateApplicationStatus error: %v\n", err)
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update status")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Status updated successfully"})
}

// AddScholarshipMessage handles POST /api/v1/scholarships/applications/{appId}/messages
func (h *ScholarshipHandler) AddScholarshipMessage(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "appId")

	var req struct {
		Message    string `json:"message"`
		IsInternal bool   `json:"is_internal"`
	}
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid body")
		return
	}

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	msg, err := h.service.AddScholarshipMessage(r.Context(), appIDStr, userID, req.Message, req.IsInternal)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to add message")
		return
	}

	writeJSON(w, http.StatusCreated, msg)
}

// AssignCaseWorker handles PUT /api/v1/scholarships/applications/{appId}/assign
func (h *ScholarshipHandler) AssignCaseWorker(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "appId")

	var req model.AssignCaseRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid body")
		return
	}

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.service.AssignCase(r.Context(), appIDStr, userID, req); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to assign case")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Assignment updated successfully"})
}

// UpdatePriority handles PUT /api/v1/scholarships/applications/{appId}/priority
func (h *ScholarshipHandler) UpdatePriority(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "appId")

	var req model.UpdatePriorityRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid body")
		return
	}

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.service.UpdatePriority(r.Context(), appIDStr, userID, req); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update priority")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Priority updated successfully"})
}

// GetMyAssignedApplications handles GET /api/v1/scholarships/applications/assigned-to-me
func (h *ScholarshipHandler) GetMyAssignedApplications(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	apps, err := h.service.GetAssignedCases(r.Context(), userID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get assigned applications")
		return
	}

	if apps == nil {
		apps = []model.ScholarshipApplication{}
	}

	writeJSON(w, http.StatusOK, apps)
}

// SubmitApplicationScore handles POST /api/v1/scholarships/applications/{appId}/score
func (h *ScholarshipHandler) SubmitApplicationScore(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "appId")

	var req []struct {
		CriteriaName string  `json:"criteria_name"`
		Score        float64 `json:"score"`
		MaxScore     float64 `json:"max_score"`
		Notes        string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	var totalScore float64
	for _, item := range req {
		totalScore += item.Score
	}

	reqBytes, _ := json.Marshal(req)

	// Since auth is mocked for now, we use a dummy UUID or get it from context if it was set
	judgeID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001") // TODO: Get from auth context

	if err := h.service.SubmitApplicationScore(r.Context(), appIDStr, judgeID, totalScore, string(reqBytes)); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to submit score")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Score submitted successfully"})
}
