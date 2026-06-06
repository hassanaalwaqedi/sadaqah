package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/service"
)

type AuditHandler struct {
	auditService *service.AuditService
}

func NewAuditHandler(auditService *service.AuditService) *AuditHandler {
	return &AuditHandler{auditService: auditService}
}

// GetLogs handles GET /api/v1/admin/audit-logs
func (h *AuditHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	params := parsePagination(r)

	filters := map[string]string{
		"action":      r.URL.Query().Get("action"),
		"entity_type": r.URL.Query().Get("entity_type"),
		"user_id":     r.URL.Query().Get("user_id"),
		"from":        r.URL.Query().Get("from"),
		"to":          r.URL.Query().Get("to"),
		"search":      r.URL.Query().Get("search"),
	}

	resp, err := h.auditService.GetLogs(r.Context(), params, filters)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve audit logs")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

