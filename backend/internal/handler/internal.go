package handler

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/service"
)

// InternalHandler handles internal webhooks from the AI worker.
type InternalHandler struct {
	scholarshipService *service.ScholarshipService
}

// NewInternalHandler creates a new InternalHandler.
func NewInternalHandler(scholarshipService *service.ScholarshipService) *InternalHandler {
	return &InternalHandler{scholarshipService: scholarshipService}
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

	// 1. Update OCR Task in database
	// 2. If confidence > threshold and no error, update the application with the verified GPA
	// For now, we'll just log it.
	
	// In a complete implementation, we'd call a service method like:
	// h.scholarshipService.ProcessOCRResult(r.Context(), payload)

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

	// In a complete implementation, we'd call a service method like:
	// h.scholarshipService.ProcessRankingResult(r.Context(), payload)

	writeJSON(w, http.StatusOK, map[string]string{"message": "Ranking result received"})
}
