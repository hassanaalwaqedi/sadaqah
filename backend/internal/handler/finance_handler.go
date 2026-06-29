package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

type FinanceHandler struct {
	svc *service.FinanceService
}

func NewFinanceHandler(svc *service.FinanceService) *FinanceHandler {
	return &FinanceHandler{svc: svc}
}

func (h *FinanceHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	creatorID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req model.FinancialTransaction
	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	req.RecordedBy = &creatorID

	tx, err := h.svc.CreateTransaction(r.Context(), &req, creatorID)
	if err != nil {
		http.Error(w, "Failed to create transaction", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, tx)
}

func (h *FinanceHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	offset := 0
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	txs, err := h.svc.GetTransactions(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to get transactions", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, txs)
}

func (h *FinanceHandler) ApproveTransaction(w http.ResponseWriter, r *http.Request) {
	approverID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	roles := middleware.GetUserRoles(r.Context())
	isManager := false
	for _, role := range roles {
		if role == "finance_manager" || role == "super_admin" {
			isManager = true
			break
		}
	}

	txIDStr := chi.URLParam(r, "id")
	txID, err := uuid.Parse(txIDStr)
	if err != nil {
		http.Error(w, "Invalid transaction ID", http.StatusBadRequest)
		return
	}

	if err := h.svc.ApproveTransaction(r.Context(), txID, approverID, isManager); err != nil {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Transaction approved successfully"})
}
