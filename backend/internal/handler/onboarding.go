package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/repository"
)

type OnboardingHandler struct {
	userRepo *repository.UserRepository
}

func NewOnboardingHandler(userRepo *repository.UserRepository) *OnboardingHandler {
	return &OnboardingHandler{userRepo: userRepo}
}

// Phase1Identity handles POST /api/v1/auth/onboarding/identity
func (h *OnboardingHandler) Phase1Identity(w http.ResponseWriter, r *http.Request) {
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
		Gender      string `json:"gender"`
		Nationality string `json:"nationality"`
		Country     string `json:"country"` // Address placeholder
		City        string `json:"city"`    // Address placeholder
	}
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	profile, err := h.userRepo.GetProfile(r.Context(), userID)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get profile")
		return
	}
	if profile == nil {
		writeError(w, r, http.StatusNotFound, "NOT_FOUND", "Profile not found")
		return
	}

	profile.FirstNameEN = req.FirstNameEN
	profile.LastNameEN = req.LastNameEN
	if req.FirstNameAR != "" {
		profile.FirstNameAR = &req.FirstNameAR
	}
	if req.LastNameAR != "" {
		profile.LastNameAR = &req.LastNameAR
	}
	if req.Phone != "" {
		profile.Phone = &req.Phone
	}
	if req.Gender != "" {
		profile.Gender = &req.Gender
	}
	if req.Nationality != "" {
		profile.Nationality = &req.Nationality
	}
	
	// Assuming address string for country/city
	address := req.City + ", " + req.Country
	profile.Address = &address

	if err := h.userRepo.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update identity")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Identity updated successfully"})
}

// Phase2Interests handles POST /api/v1/auth/onboarding/interests
func (h *OnboardingHandler) Phase2Interests(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	var req struct {
		Interests []string `json:"interests"`
	}
	if !parseAndValidateJSON(w, r, &req) {
		return
	}

	if err := h.userRepo.UpdateUserInterests(r.Context(), userID, req.Interests); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update interests")
		return
	}

	// Mark profile as completed
	if err := h.userRepo.SetProfileCompleted(r.Context(), userID); err != nil {
		h.userRepo.UpdateUserInterests(r.Context(), userID, nil) // rollback somewhat
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to mark profile as completed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Interests updated successfully"})
}
