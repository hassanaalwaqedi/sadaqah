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
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		NameEn             string `json:"name_en"`
		NameAr             string `json:"name_ar"`
		Description        string `json:"description"`
		SubmissionDeadline string `json:"submission_deadline"`
	}

	if err := ParseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	deadline, err := time.Parse(time.RFC3339, req.SubmissionDeadline)
	if err != nil {
		http.Error(w, "Invalid date format for deadline", http.StatusBadRequest)
		return
	}

	event, err := h.svc.CreateEvent(r.Context(), req.NameEn, req.NameAr, req.Description, deadline, claims.UserID.String())
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusCreated, event)
}

func (h *InnovationHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	events, err := h.svc.GetEvents(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
		return
	}
	RespondJSON(w, http.StatusOK, events)
}

func (h *InnovationHandler) SubmitProject(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	_ = eventID // To be used if we validate event bounds

	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		CategoryID  string `json:"category_id"`
		Title       string `json:"title"`
		Abstract    string `json:"abstract"`
		Description string `json:"description"`
	}

	if err := ParseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	proj, err := h.svc.SubmitProject(r.Context(), req.CategoryID, claims.UserID.String(), req.Title, req.Abstract, req.Description)
	if err != nil {
		http.Error(w, "Failed to submit project", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusCreated, proj)
}

func (h *InnovationHandler) GetJudgingAssignments(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projects, err := h.svc.GetJudgingAssignments(r.Context(), claims.UserID.String())
	if err != nil {
		http.Error(w, "Failed to fetch assignments", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusOK, projects)
}

func (h *InnovationHandler) SubmitScores(w http.ResponseWriter, r *http.Request) {
	assignmentID := chi.URLParam(r, "assignmentId")

	var req struct {
		Scores []model.JudgingScore `json:"scores"`
	}

	if err := ParseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.SubmitScores(r.Context(), assignmentID, req.Scores)
	if err != nil {
		http.Error(w, "Failed to submit scores", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{"message": "Scores successfully submitted"})
}
