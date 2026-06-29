package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

type InnovationHandler struct {
	svc *service.InnovationService
}

func NewInnovationHandler(svc *service.InnovationService) *InnovationHandler {
	return &InnovationHandler{svc: svc}
}

func (h *InnovationHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		NameEn             string                 `json:"name_en"`
		NameAr             string                 `json:"name_ar"`
		Description        string                 `json:"description"`
		SubmissionDeadline string                 `json:"submission_deadline"`
		Configuration      map[string]interface{} `json:"configuration"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	deadline, err := time.Parse(time.RFC3339, req.SubmissionDeadline)
	if err != nil {
		http.Error(w, "Invalid date format for deadline", http.StatusBadRequest)
		return
	}

	event, err := h.svc.CreateEvent(r.Context(), req.NameEn, req.NameAr, req.Description, deadline, req.Configuration, id.String())
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, event)
}

func (h *InnovationHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	events, err := h.svc.GetEvents(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, events)
}

func (h *InnovationHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	event, err := h.svc.GetEventByID(r.Context(), eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, event)
}

func (h *InnovationHandler) GetMyProjects(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projects, err := h.svc.GetMyProjects(r.Context(), id.String())
	if err != nil {
		http.Error(w, "Failed to fetch projects", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, projects)
}

func (h *InnovationHandler) SubmitProject(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	_ = eventID // To be used if we validate event bounds

	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		CategoryID  string                 `json:"category_id"`
		Title       string                 `json:"title"`
		Abstract    string                 `json:"abstract"`
		Description string                 `json:"description"`
		ExtraData   map[string]interface{} `json:"extra_data"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	proj, err := h.svc.SubmitProject(r.Context(), req.CategoryID, id.String(), req.Title, req.Abstract, req.Description, req.ExtraData)
	if err != nil {
		http.Error(w, "Failed to submit project", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, proj)
}

func (h *InnovationHandler) GetJudgingAssignments(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projects, err := h.svc.GetJudgingAssignments(r.Context(), id.String())
	if err != nil {
		http.Error(w, "Failed to fetch assignments", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, projects)
}

func (h *InnovationHandler) SubmitScores(w http.ResponseWriter, r *http.Request) {
	assignmentID := chi.URLParam(r, "assignmentId")

	var req struct {
		Scores []model.JudgingScore `json:"scores"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.SubmitScores(r.Context(), assignmentID, req.Scores)
	if err != nil {
		http.Error(w, "Failed to submit scores", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Scores successfully submitted"})
}

// ── Admin & Tracking Ecosystem ──

func (h *InnovationHandler) GetApplicationsByEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	apps, err := h.svc.GetApplicationsByEvent(r.Context(), eventID)
	if err != nil {
		http.Error(w, "Failed to fetch applications", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, apps)
}

func (h *InnovationHandler) GetApplicationDetails(w http.ResponseWriter, r *http.Request) {
	appID := chi.URLParam(r, "appId")
	details, err := h.svc.GetApplicationDetails(r.Context(), appID)
	if err != nil {
		http.Error(w, "Application not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, details)
}

func (h *InnovationHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	appID := chi.URLParam(r, "appId")
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req model.UpdateInnovationStatusRequest
	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.UpdateApplicationStatus(r.Context(), appID, req.Status, req.Message, userID.String(), req.IsInternal)
	if err != nil {
		http.Error(w, "Failed to update application status", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Status updated successfully"})
}

func (h *InnovationHandler) AddApplicationMessage(w http.ResponseWriter, r *http.Request) {
	appID := chi.URLParam(r, "appId")
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req model.InnovationMessageRequest
	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.AddApplicationMessage(r.Context(), appID, userID.String(), req.Message, req.IsInternal)
	if err != nil {
		http.Error(w, "Failed to add message", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"message": "Message added successfully"})
}
