package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

type DonationHandler struct {
	svc *service.DonationService
}

func NewDonationHandler(svc *service.DonationService) *DonationHandler {
	return &DonationHandler{svc: svc}
}

func (h *DonationHandler) GetCampaigns(w http.ResponseWriter, r *http.Request) {
	campaigns, err := h.svc.GetCampaigns(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch campaigns", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, campaigns)
}

func (h *DonationHandler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TitleEn     string  `json:"title_en"`
		TitleAr     string  `json:"title_ar"`
		Description string  `json:"description"`
		GoalAmount  float64 `json:"goal_amount"`
		Currency    string  `json:"currency"`
		Category    string  `json:"category"`
		Visibility  string  `json:"visibility"`
		Priority    string  `json:"priority"`
		StartDate   string  `json:"start_date"`
		EndDate     string  `json:"end_date"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	campaign, err := h.svc.CreateCampaign(r.Context(), req.TitleEn, req.TitleAr, req.Description, req.GoalAmount, req.Currency, req.StartDate, req.EndDate, req.Category, req.Visibility, req.Priority, adminID.String())
	if err != nil {
		http.Error(w, "Failed to create campaign", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, campaign)
}

func (h *DonationHandler) ProcessDonation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CampaignID    string  `json:"campaign_id"`
		DonorEmail    string  `json:"donor_email"`
		Amount        float64 `json:"amount"`
		Currency      string  `json:"currency"`
		PaymentMethod string  `json:"payment_method"`
		IsAnonymous   bool    `json:"is_anonymous"`
		DonationType  string  `json:"donation_type"`
		Notes         string  `json:"notes"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var donorID *string
	if id, ok := middleware.GetUserID(r.Context()); ok {
		strID := id.String()
		donorID = &strID
	}

	paymentRef := "MOCK_TX_987654321"

	donationType := req.DonationType
	if donationType == "" {
		donationType = "General"
	}

	donation, err := h.svc.ProcessDonation(r.Context(), req.CampaignID, donorID, req.DonorEmail, req.Amount, req.Currency, req.PaymentMethod, paymentRef, req.IsAnonymous, donationType, req.Notes)
	if err != nil {
		http.Error(w, "Failed to process donation", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, donation)
}

func (h *DonationHandler) GetDonationHistory(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	donations, err := h.svc.GetDonationsByDonor(r.Context(), id.String())
	if err != nil {
		http.Error(w, "Failed to fetch donation history", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, donations)
}

func (h *DonationHandler) GetAllDonations(w http.ResponseWriter, r *http.Request) {
	donations, err := h.svc.GetAllDonations(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch all donations", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, donations)
}

func (h *DonationHandler) AllocateDonation(w http.ResponseWriter, r *http.Request) {
	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	donationID := chi.URLParam(r, "id")

	var req struct {
		BudgetAllocationID string  `json:"budget_allocation_id"`
		Program            string  `json:"program"`
		Notes              string  `json:"notes"`
		Status             string  `json:"status"`
		Amount             float64 `json:"amount"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.AllocateDonation(r.Context(), donationID, req.BudgetAllocationID, req.Program, req.Notes, req.Status, adminID.String(), req.Amount)
	if err != nil {
		http.Error(w, "Failed to allocate donation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Donation allocated successfully"})
}

func (h *DonationHandler) GetDonorImpactSummary(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	summary, err := h.svc.GetDonorImpactSummary(r.Context(), userID.String())
	if err != nil {
		http.Error(w, "Failed to fetch impact summary", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

func (h *DonationHandler) PublishImpactUpdate(w http.ResponseWriter, r *http.Request) {
	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Program   string `json:"program"`
		TitleEn   string `json:"title_en"`
		TitleAr   string `json:"title_ar"`
		ContentEn string `json:"content_en"`
		ContentAr string `json:"content_ar"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	update, err := h.svc.PublishImpactUpdate(r.Context(), req.Program, req.TitleEn, req.TitleAr, req.ContentEn, req.ContentAr, adminID.String())
	if err != nil {
		http.Error(w, "Failed to publish impact update: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, update)
}

func (h *DonationHandler) GetImpactUpdates(w http.ResponseWriter, r *http.Request) {
	updates, err := h.svc.GetImpactUpdates(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch impact updates", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, updates)
}

func (h *DonationHandler) GetCampaignByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	campaign, err := h.svc.GetCampaignByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Failed to fetch campaign", http.StatusInternalServerError)
		return
	}
	if campaign == nil {
		http.Error(w, "Campaign not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, campaign)
}

func (h *DonationHandler) UploadTransferReceipt(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	donationID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid donation ID")
		return
	}

	donorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	var req model.UploadReceiptRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload")
		return
	}

	if err := h.svc.UploadTransferReceipt(r.Context(), donationID, donorID, req); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Receipt uploaded successfully"})
}

func (h *DonationHandler) VerifyDonation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	donationID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "INVALID_ID", "Invalid donation ID")
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	var req model.VerifyDonationRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid payload")
		return
	}

	if err := h.svc.VerifyDonation(r.Context(), donationID, adminID, req); err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Donation verified successfully"})
}
