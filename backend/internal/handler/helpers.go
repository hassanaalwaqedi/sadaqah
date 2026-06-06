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

// ── Auth Cookie Helpers ──

// setAuthCookies sets secure HTTP-only cookies for access and refresh tokens.
func setAuthCookies(w http.ResponseWriter, r *http.Request, accessToken, refreshToken string, accessExpiry, refreshExpiry time.Duration) {
	// Determine if we should use Secure cookies (true in production/HTTPS)
	isSecure := r.Header.Get("X-Forwarded-Proto") == "https" || r.TLS != nil

	if accessToken != "" {
		http.SetCookie(w, &http.Cookie{
			Name:     "access_token",
			Value:    accessToken,
			Path:     "/",
			HttpOnly: true,
			Secure:   isSecure,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   int(accessExpiry.Seconds()),
		})
	}

	if refreshToken != "" {
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Path:     "/api/v1/auth/refresh", // Only send refresh token on refresh endpoint
			HttpOnly: true,
			Secure:   isSecure,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   int(refreshExpiry.Seconds()),
		})
	}
}

// clearAuthCookies clears the auth cookies.
func clearAuthCookies(w http.ResponseWriter, r *http.Request) {
	isSecure := r.Header.Get("X-Forwarded-Proto") == "https" || r.TLS != nil

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth/refresh",
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

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

// parseAndValidateJSON decodes JSON, validates with struct tags, and writes errors automatically.
// Returns true if validation passed, false if an error response was already written.
func parseAndValidateJSON(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	if err := parseJSON(r, dst); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return false
	}

	if errs := validateStruct(dst); len(errs) > 0 {
		writeValidationError(w, r, errs)
		return false
	}

	return true
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
