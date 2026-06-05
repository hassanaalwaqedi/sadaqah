package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// EvaluationHandler handles evaluation and judging requests.
type EvaluationHandler struct {
	service *service.EvaluationService
}

// NewEvaluationHandler creates a new EvaluationHandler.
func NewEvaluationHandler(svc *service.EvaluationService) *EvaluationHandler {
	return &EvaluationHandler{service: svc}
}

// GetMyEvaluations handles GET /api/v1/evaluations/me
func (h *EvaluationHandler) GetMyEvaluations(w http.ResponseWriter, r *http.Request) {
	judgeID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	evals, err := h.service.GetJudgeEvaluations(r.Context(), judgeID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch evaluations")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"data": evals})
}

// SubmitScores handles POST /api/v1/evaluations/{id}/score
func (h *EvaluationHandler) SubmitScores(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	evaluationID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid evaluation ID")
		return
	}

	var req model.SubmitScoreRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	judgeID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	if err := h.service.SubmitScores(r.Context(), judgeID, evaluationID, req); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to submit scores")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Scores submitted successfully"})
}
