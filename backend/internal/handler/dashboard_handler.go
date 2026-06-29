package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/service"
)

type DashboardHandler struct {
	svc *service.DashboardService
}

func NewDashboardHandler(svc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

func (h *DashboardHandler) GetDashboardData(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	roles := middleware.GetUserRoles(ctx)

	data, err := h.svc.GetDashboardData(ctx, userID, roles)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to get dashboard data")
		return
	}

	writeJSON(w, http.StatusOK, data)
}
