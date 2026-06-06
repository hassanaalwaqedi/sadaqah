package handler

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

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
	if !parseAndValidateJSON(w, r, &req) {
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

	setAuthCookies(w, r, resp.AccessToken, resp.RefreshToken, 15*time.Minute, 168*time.Hour)
	resp.AccessToken = ""
	resp.RefreshToken = ""
	writeJSON(w, http.StatusCreated, resp)
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if !parseAndValidateJSON(w, r, &req) {
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

	setAuthCookies(w, r, resp.AccessToken, resp.RefreshToken, 15*time.Minute, 168*time.Hour)
	resp.AccessToken = ""
	resp.RefreshToken = ""
	writeJSON(w, http.StatusOK, resp)
}

// GoogleLogin handles POST /api/v1/auth/google
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"id_token"`
	}
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if req.IDToken == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "id_token is required")
		return
	}

	ip := getClientIP(r)
	userAgent := r.UserAgent()

	resp, err := h.authService.GoogleLogin(r.Context(), req.IDToken, ip, userAgent)
	if err != nil {
		if errors.Is(err, service.ErrAccountInactive) {
			writeError(w, r, http.StatusForbidden, "FORBIDDEN", "Account is inactive")
			return
		}
		log.Printf("[DEBUG] GoogleLogin service error: %v", err)
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid Google token or login failed")
		return
	}

	setAuthCookies(w, r, resp.AccessToken, resp.RefreshToken, 15*time.Minute, 168*time.Hour)
	resp.AccessToken = ""
	resp.RefreshToken = ""
	writeJSON(w, http.StatusOK, resp)
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req model.RefreshRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	// First try to get refresh token from cookie
	cookie, err := r.Cookie("refresh_token")
	if err == nil {
		req.RefreshToken = cookie.Value
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

	setAuthCookies(w, r, resp.AccessToken, resp.RefreshToken, 15*time.Minute, 168*time.Hour)
	resp.AccessToken = ""
	resp.RefreshToken = ""
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

	clearAuthCookies(w, r)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
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
