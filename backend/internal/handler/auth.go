package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// AuthHandler handles authentication HTTP requests.
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register handles POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	// Validate
	var errs []model.FieldError
	if req.Email == "" {
		errs = append(errs, model.FieldError{Field: "email", Message: "Email is required"})
	}
	if req.Password == "" {
		errs = append(errs, model.FieldError{Field: "password", Message: "Password is required"})
	} else if len(req.Password) < 8 {
		errs = append(errs, model.FieldError{Field: "password", Message: "Password must be at least 8 characters"})
	}
	if req.FirstNameEN == "" {
		errs = append(errs, model.FieldError{Field: "first_name_en", Message: "First name (English) is required"})
	}
	if req.LastNameEN == "" {
		errs = append(errs, model.FieldError{Field: "last_name_en", Message: "Last name (English) is required"})
	}
	if len(errs) > 0 {
		writeValidationError(w, r, errs)
		return
	}

	resp, err := h.authService.Register(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrEmailAlreadyExists) {
			writeError(w, r, http.StatusConflict, "CONFLICT", "An account with this email already exists")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create account")
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	// Validate
	var errs []model.FieldError
	if req.Email == "" {
		errs = append(errs, model.FieldError{Field: "email", Message: "Email is required"})
	}
	if req.Password == "" {
		errs = append(errs, model.FieldError{Field: "password", Message: "Password is required"})
	}
	if len(errs) > 0 {
		writeValidationError(w, r, errs)
		return
	}

	ip := getClientIP(r)
	userAgent := r.UserAgent()

	resp, err := h.authService.Login(r.Context(), req, ip, userAgent)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid email or password")
		case errors.Is(err, service.ErrAccountLocked):
			writeError(w, r, http.StatusTooManyRequests, "RATE_LIMITED", "Account temporarily locked. Try again later")
		case errors.Is(err, service.ErrAccountInactive):
			writeError(w, r, http.StatusForbidden, "FORBIDDEN", "Account is inactive")
		default:
			writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Login failed")
		}
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req model.RefreshRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if req.RefreshToken == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Refresh token is required")
		return
	}

	ip := getClientIP(r)
	userAgent := r.UserAgent()

	resp, err := h.authService.RefreshTokens(r.Context(), req.RefreshToken, ip, userAgent)
	if err != nil {
		if errors.Is(err, service.ErrInvalidRefreshToken) {
			writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired refresh token")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Token refresh failed")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	// Extract the access token to blacklist it
	accessToken := ""
	if auth := r.Header.Get("Authorization"); auth != "" {
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) == 2 {
			accessToken = parts[1]
		}
	}

	if err := h.authService.Logout(r.Context(), userID, accessToken); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Logout failed")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Logged out successfully"})
}

// Me handles GET /api/v1/users/me
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	user, err := h.authService.GetCurrentUser(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			writeError(w, r, http.StatusNotFound, "NOT_FOUND", "User not found")
			return
		}
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get user")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// ForgotPassword handles POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req model.ForgotPasswordRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	// Always return success to prevent email enumeration
	writeJSON(w, http.StatusOK, model.SuccessResponse{
		Message: "If an account with that email exists, a password reset link has been sent",
	})
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req model.ResetPasswordRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if req.Token == "" || req.NewPassword == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Token and new password are required")
		return
	}

	if len(req.NewPassword) < 8 {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Password must be at least 8 characters")
		return
	}

	// TODO: Implement password reset token validation and password update
	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Password has been reset successfully"})
}

// VerifyEmail handles POST /api/v1/auth/verify-email
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req model.VerifyEmailRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if req.Token == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Verification token is required")
		return
	}

	// TODO: Implement email verification token validation
	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Email verified successfully"})
}
