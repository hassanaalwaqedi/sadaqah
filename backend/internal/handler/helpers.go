package handler

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
)

// ── JSON Helpers ──

// writeJSON writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// writeError writes a standardized error response.
func writeError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	writeJSON(w, status, map[string]interface{}{
		"error": model.APIError{
			Code:      code,
			Message:   message,
			RequestID: middleware.GetRequestID(r.Context()),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// writeValidationError writes a validation error response.
func writeValidationError(w http.ResponseWriter, r *http.Request, details []model.FieldError) {
	writeJSON(w, http.StatusBadRequest, map[string]interface{}{
		"error": model.APIError{
			Code:      "VALIDATION_ERROR",
			Message:   "Invalid input data",
			Details:   details,
			RequestID: middleware.GetRequestID(r.Context()),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// parseJSON decodes the request body into the given destination.
func parseJSON(r *http.Request, dst interface{}) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

// ── Pagination Helpers ──

// parsePagination extracts pagination parameters from query string.
func parsePagination(r *http.Request) model.PaginationParams {
	p := model.DefaultPagination()

	if page := r.URL.Query().Get("page"); page != "" {
		if v, err := strconv.Atoi(page); err == nil && v > 0 {
			p.Page = v
		}
	}
	if pageSize := r.URL.Query().Get("page_size"); pageSize != "" {
		if v, err := strconv.Atoi(pageSize); err == nil && v > 0 && v <= 100 {
			p.PageSize = v
		}
	}
	if sort := r.URL.Query().Get("sort"); sort != "" {
		p.Sort = sort
	}
	if order := r.URL.Query().Get("order"); order != "" {
		p.Order = order
	}
	if search := r.URL.Query().Get("search"); search != "" {
		p.Search = search
	}

	return p
}

// paginatedResponse builds a PaginatedResponse.
func paginatedResponse(data interface{}, total int64, params model.PaginationParams) model.PaginatedResponse {
	totalPages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return model.PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}
}

// ── Request Helpers ──

// getClientIP extracts the client IP from the request.
func getClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return xff
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	return r.RemoteAddr
}
