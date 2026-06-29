package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/service"
)

type ReportHandler struct {
	svc *service.ReportService
}

func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func (h *ReportHandler) GetScholarshipsReport(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetScholarshipStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *ReportHandler) GetDonationsReport(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetDonationStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *ReportHandler) GetFinanceReport(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetFinanceStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *ReportHandler) GetInnovationReport(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetInnovationStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *ReportHandler) GetUserReport(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetUserStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *ReportHandler) GetSystemOverview(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetSystemOverview(r.Context())
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

