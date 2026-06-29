package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type ProfileHandler struct {
	userRepo *repository.UserRepository
}

func NewProfileHandler(userRepo *repository.UserRepository) *ProfileHandler {
	return &ProfileHandler{userRepo: userRepo}
}

// GetVault handles GET /api/v1/profile/vault
func (h *ProfileHandler) GetVault(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	docs, err := h.userRepo.GetUserDocuments(r.Context(), userID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get documents")
		return
	}

	writeJSON(w, http.StatusOK, docs)
}

// AddToVault handles POST /api/v1/profile/vault
func (h *ProfileHandler) AddToVault(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	var req struct {
		DocumentType string `json:"document_type"`
		FileURL      string `json:"file_url"`
		Metadata     json.RawMessage `json:"metadata"`
	}
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	doc := &model.UserDocument{
		UserID:       userID,
		DocumentType: req.DocumentType,
		FileURL:      req.FileURL,
		Metadata:     req.Metadata,
	}

	if err := h.userRepo.AddUserDocument(r.Context(), doc); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to add document")
		return
	}

	writeJSON(w, http.StatusCreated, doc)
}

// GetUniversalProfile handles GET /api/v1/profile
func (h *ProfileHandler) GetUniversalProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	identity, _ := h.userRepo.GetProfile(r.Context(), userID)
	interests, _ := h.userRepo.GetUserInterests(r.Context(), userID)
	
	// Fetching specialized profiles is skipped here for brevity unless specifically requested.
	// For now we just return the identity and interests.
	
	var universalProfile model.UniversalProfile
	if identity != nil {
		universalProfile.Identity = *identity
	}
	universalProfile.Interests = interests

	writeJSON(w, http.StatusOK, universalProfile)
}

// UpdateUniversalProfile handles PUT /api/v1/profile
func (h *ProfileHandler) UpdateUniversalProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	var req struct {
		FirstNameEN string `json:"first_name_en"`
		FirstNameAR string `json:"first_name_ar"`
		LastNameEN  string `json:"last_name_en"`
		LastNameAR  string `json:"last_name_ar"`
		Phone       string `json:"phone"`
		DateOfBirth string `json:"date_of_birth"`
		AvatarFileID string `json:"avatar_file_id"`
	}
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	profile, err := h.userRepo.GetProfile(r.Context(), userID)
	if err != nil || profile == nil {
		writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Profile not found")
		return
	}

	if req.FirstNameEN != "" { profile.FirstNameEN = req.FirstNameEN }
	if req.LastNameEN != "" { profile.LastNameEN = req.LastNameEN }
	if req.FirstNameAR != "" { profile.FirstNameAR = &req.FirstNameAR }
	if req.LastNameAR != "" { profile.LastNameAR = &req.LastNameAR }
	if req.Phone != "" { profile.Phone = &req.Phone }
	
	if req.DateOfBirth != "" {
		importTime := "2006-01-02"
		t, err := time.Parse(importTime, req.DateOfBirth)
		if err == nil {
			profile.DateOfBirth = &t
		}
	}
	
	if req.AvatarFileID != "" {
		id, err := uuid.Parse(req.AvatarFileID)
		if err == nil {
			profile.AvatarFileID = &id
		}
	}

	if err := h.userRepo.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update profile")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Profile updated successfully"})
}
// GetAnyUserProfile handles GET /api/v1/admin/users/{id}/profile
func (h *ProfileHandler) GetAnyUserProfile(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	identity, err := h.userRepo.GetProfile(r.Context(), targetUserID)
	if err != nil && err.Error() != "no rows in result set" {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch profile")
		return
	}

	interests, _ := h.userRepo.GetUserInterests(r.Context(), targetUserID)

	res := map[string]interface{}{
		"identity":  identity,
		"interests": interests,
	}

	writeJSON(w, http.StatusOK, res)
}

// GetAnyUserVault handles GET /api/v1/admin/users/{id}/vault
func (h *ProfileHandler) GetAnyUserVault(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetUserID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
		return
	}

	docs, err := h.userRepo.GetUserDocuments(r.Context(), targetUserID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch vault")
		return
	}

	writeJSON(w, http.StatusOK, docs)
}
