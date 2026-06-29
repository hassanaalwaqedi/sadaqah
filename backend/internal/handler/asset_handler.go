package handler

import (
	"encoding/json"
	"net/http"

	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

type AssetHandler struct {
	svc *service.AssetService
}

func NewAssetHandler(svc *service.AssetService) *AssetHandler {
	return &AssetHandler{svc: svc}
}

func (h *AssetHandler) CreateAsset(w http.ResponseWriter, r *http.Request) {
	var asset model.Asset
	if err := json.NewDecoder(r.Body).Decode(&asset); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if asset.AssetNumber == "" || asset.NameEn == "" || asset.NameAr == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateAsset(r.Context(), &asset); err != nil {
		http.Error(w, "Failed to create asset", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, asset)
}

func (h *AssetHandler) GetAssets(w http.ResponseWriter, r *http.Request) {
	assets, err := h.svc.GetAssets(r.Context())
	if err != nil {
		http.Error(w, "Failed to get assets", http.StatusInternalServerError)
		return
	}
	if assets == nil {
		assets = []model.Asset{}
	}
	writeJSON(w, http.StatusOK, assets)
}

func (h *AssetHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetDashboardStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to get dashboard stats", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}
