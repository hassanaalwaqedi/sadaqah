package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// InternalHandler handles internal webhooks from the AI worker.
type InternalHandler struct {
	scholarshipService *service.ScholarshipService
	aiJobService       *service.AIJobService
}

// NewInternalHandler creates a new InternalHandler.
func NewInternalHandler(scholarshipService *service.ScholarshipService, aiJobService *service.AIJobService) *InternalHandler {
	return &InternalHandler{
		scholarshipService: scholarshipService,
		aiJobService:       aiJobService,
	}
}

// UpdateJobStatus handles PUT /api/v1/internal/jobs/{id}/status
func (h *InternalHandler) UpdateJobStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	jobID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid job ID")
		return
	}

	var req model.UpdateJobStatusRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if err := h.aiJobService.UpdateStatus(r.Context(), jobID, req.Status, req.Progress); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update job status")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Status updated"})
}

// FailJob handles POST /api/v1/internal/jobs/{id}/fail
func (h *InternalHandler) FailJob(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	jobID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid job ID")
		return
	}

	var req model.FailJobRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if err := h.aiJobService.HandleFailure(r.Context(), jobID, req.ErrorMsg); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to handle job failure")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Failure handled"})
}

// OCRResultPayload represents the payload from the AI worker.
type OCRResultPayload struct {
	TaskID          uuid.UUID              `json:"task_id"`
	ExtractedData   map[string]interface{} `json:"extracted_data"`
	ConfidenceScore float64                `json:"confidence_score"`
	RawText         string                 `json:"raw_text"`
	NeedsReview     bool                   `json:"needs_review"`
	ErrorMessage    *string                `json:"error_message"`
}

// HandleOCRResult handles POST /api/v1/internal/ocr/results
func (h *InternalHandler) HandleOCRResult(w http.ResponseWriter, r *http.Request) {
	var payload OCRResultPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}
	defer r.Body.Close()

	// 1. Mark AI Job as Complete
	rawPayload, _ := json.Marshal(payload)
	if err := h.aiJobService.CompleteJob(r.Context(), payload.TaskID, rawPayload); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to complete job")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "OCR result received"})
}

// RankingResultPayload represents the payload from the AI worker.
type RankingResultPayload struct {
	CycleID uuid.UUID `json:"cycle_id"`
	Results []struct {
		ApplicationID uuid.UUID              `json:"application_id"`
		TotalScore    float64                `json:"total_score"`
		Rank          int                    `json:"rank"`
		Breakdown     map[string]interface{} `json:"criteria_breakdown"`
	} `json:"results"`
}

// HandleRankingResult handles POST /api/v1/internal/ranking/results
func (h *InternalHandler) HandleRankingResult(w http.ResponseWriter, r *http.Request) {
	var payload RankingResultPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}
	defer r.Body.Close()

	// Marking as complete might require JobID which isn't currently in the payload, 
	// but for Phase 7 we ensure the AI worker sends results successfully.
	// Assume we do an update based on CycleID later if needed.

	writeJSON(w, http.StatusOK, map[string]string{"message": "Ranking result received"})
}
