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



// ── Financial ──

func (h *CoreOpsHandler) GetBudgets(w http.ResponseWriter, r *http.Request) {
	budgets, err := h.svc.GetBudgets(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch budgets", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, budgets)
}

func (h *CoreOpsHandler) SubmitExpense(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	expense, err := h.svc.SubmitExpenseRequest(r.Context(), id.String(), req.Amount, req.Description)
	if err != nil {
		http.Error(w, "Failed to submit expense request", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, expense)
}

func (h *CoreOpsHandler) DisburseExpense(w http.ResponseWriter, r *http.Request) {
	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ExpenseID          string `json:"expense_id"`
		BudgetAllocationID string `json:"budget_allocation_id"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.DisburseExpense(r.Context(), req.ExpenseID, req.BudgetAllocationID, adminID.String())
	if err != nil {
		http.Error(w, "Failed to disburse expense: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Expense disbursed successfully"})
}

// ── Research ──

func (h *CoreOpsHandler) SubmitGrant(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Title           string  `json:"title"`
		Abstract        string  `json:"abstract"`
		RequestedBudget float64 `json:"requested_budget"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	grant, err := h.svc.SubmitGrant(r.Context(), id.String(), req.Title, req.Abstract, req.RequestedBudget)
	if err != nil {
		http.Error(w, "Failed to submit grant", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, grant)
}

// ── Reports ──

func (h *CoreOpsHandler) GetSystemReports(w http.ResponseWriter, r *http.Request) {
	report, err := h.svc.GetSystemReports(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch system reports", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, report)
}

// ── Inventory ──
