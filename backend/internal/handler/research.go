package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/service"
)

type ResearchHandler struct {
	svc *service.ResearchService
}

func NewResearchHandler(svc *service.ResearchService) *ResearchHandler {
	return &ResearchHandler{svc: svc}
}

func (h *ResearchHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetDashboardStats(r.Context())
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch dashboard stats")
		return
	}

	grants, err := h.svc.GetOpenGrantPrograms(r.Context())
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch grants")
		return
	}

	pubs, err := h.svc.GetRecentPublications(r.Context(), 5)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch publications")
		return
	}

	projects, err := h.svc.GetActiveProjects(r.Context(), 5)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch active projects")
		return
	}

	conferences, err := h.svc.GetUpcomingConferences(r.Context(), 3)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch upcoming conferences")
		return
	}

	response := map[string]interface{}{
		"stats":       stats,
		"grants":      grants,
		"publications": pubs,
		"projects":    projects,
		"conferences": conferences,
	}

	writeJSON(w, http.StatusOK, response)
}
