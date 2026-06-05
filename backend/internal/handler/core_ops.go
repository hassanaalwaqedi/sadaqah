package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/service"
)

type CoreOpsHandler struct {
	svc *service.CoreOpsService
}

func NewCoreOpsHandler(svc *service.CoreOpsService) *CoreOpsHandler {
	return &CoreOpsHandler{svc: svc}
}

// ── Donations & Campaigns ──

func (h *CoreOpsHandler) GetCampaigns(w http.ResponseWriter, r *http.Request) {
	campaigns, err := h.svc.GetCampaigns(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch campaigns", http.StatusInternalServerError)
		return
	}
	RespondJSON(w, http.StatusOK, campaigns)
}

func (h *CoreOpsHandler) ProcessDonation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CampaignID    string  `json:"campaign_id"`
		Amount        float64 `json:"amount"`
		Currency      string  `json:"currency"`
		PaymentMethod string  `json:"payment_method"`
		IsAnonymous   bool    `json:"is_anonymous"`
	}

	if err := ParseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Try to get donor ID if logged in, otherwise nil
	var donorID *string
	if claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.Claims); ok {
		id := claims.UserID.String()
		donorID = &id
	}

	// Mocking payment reference for now
	paymentRef := "MOCK_TX_987654321"

	donation, err := h.svc.ProcessDonation(r.Context(), req.CampaignID, donorID, req.Amount, req.Currency, req.PaymentMethod, paymentRef, req.IsAnonymous)
	if err != nil {
		http.Error(w, "Failed to process donation", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusCreated, donation)
}

// ── Financial ──

func (h *CoreOpsHandler) GetBudgets(w http.ResponseWriter, r *http.Request) {
	budgets, err := h.svc.GetBudgets(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch budgets", http.StatusInternalServerError)
		return
	}
	RespondJSON(w, http.StatusOK, budgets)
}

// ── Research ──

func (h *CoreOpsHandler) SubmitGrant(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Title           string  `json:"title"`
		Abstract        string  `json:"abstract"`
		RequestedBudget float64 `json:"requested_budget"`
	}

	if err := ParseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	grant, err := h.svc.SubmitGrant(r.Context(), claims.UserID.String(), req.Title, req.Abstract, req.RequestedBudget)
	if err != nil {
		http.Error(w, "Failed to submit grant", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusCreated, grant)
}

// ── Inventory ──

func (h *CoreOpsHandler) GetAssets(w http.ResponseWriter, r *http.Request) {
	assets, err := h.svc.GetAssets(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch assets", http.StatusInternalServerError)
		return
	}
	RespondJSON(w, http.StatusOK, assets)
}
