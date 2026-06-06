package handler

import (
	"net/http"
	"time"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

type OnboardingHandler struct {
	userRepo *repository.UserRepository
}

func NewOnboardingHandler(userRepo *repository.UserRepository) *OnboardingHandler {
	return &OnboardingHandler{userRepo: userRepo}
}

// Submit handles POST /api/v1/onboarding
func (h *OnboardingHandler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	var req struct {
		PhoneNumber      string  `json:"phone_number"`
		Nationality      string  `json:"nationality"`
		Country          string  `json:"country"`
		City             string  `json:"city"`
		UniversityName   string  `json:"university_name"`
		Faculty          string  `json:"faculty"`
		Department       string  `json:"department"`
		AcademicYear     int     `json:"academic_year"`
		GPA              float64 `json:"gpa"`
		HousingRequired  bool    `json:"housing_required"`
		FamilyIncome     float64 `json:"family_income"`
		EmergencyContact string  `json:"emergency_contact"`
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	// Basic validation
	var errs []model.FieldError
	if req.PhoneNumber == "" {
		errs = append(errs, model.FieldError{Field: "phone_number", Message: "Phone number is required"})
	}
	if req.GPA < 0.0 || req.GPA > 4.0 {
		errs = append(errs, model.FieldError{Field: "gpa", Message: "GPA must be between 0.0 and 4.0"})
	}
	if req.AcademicYear < 1 || req.AcademicYear > 7 {
		errs = append(errs, model.FieldError{Field: "academic_year", Message: "Invalid academic year"})
	}
	if len(errs) > 0 {
		writeValidationError(w, r, errs)
		return
	}

	now := time.Now().UTC()
	profile := &model.StudentProfile{
		UserID:           userID,
		PhoneNumber:      &req.PhoneNumber,
		Nationality:      &req.Nationality,
		Country:          &req.Country,
		City:             &req.City,
		UniversityName:   &req.UniversityName,
		Faculty:          &req.Faculty,
		Department:       &req.Department,
		AcademicYear:     &req.AcademicYear,
		GPA:              &req.GPA,
		HousingRequired:  req.HousingRequired,
		FamilyIncome:     &req.FamilyIncome,
		EmergencyContact: &req.EmergencyContact,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	// Check if already completed
	existingUser, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil || existingUser == nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve user")
		return
	}

	if existingUser.ProfileCompleted {
		writeError(w, r, http.StatusConflict, "ALREADY_COMPLETED", "Profile is already completed")
		return
	}

	// Insert profile
	if err := h.userRepo.CreateStudentProfile(r.Context(), profile); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save student profile")
		return
	}

	// Mark user profile as completed
	if err := h.userRepo.SetProfileCompleted(r.Context(), userID); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update profile status")
		return
	}

	writeJSON(w, http.StatusOK, model.SuccessResponse{Message: "Onboarding completed successfully"})
}
