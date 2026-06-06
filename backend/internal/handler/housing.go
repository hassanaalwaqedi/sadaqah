package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/service"
)

type HousingHandler struct {
	svc *service.HousingService
}

func NewHousingHandler(svc *service.HousingService) *HousingHandler {
	return &HousingHandler{svc: svc}
}

// GetBuildings returns the list of dormitory buildings
func (h *HousingHandler) GetBuildings(w http.ResponseWriter, r *http.Request) {
	buildings, err := h.svc.GetBuildings(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch buildings", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, buildings)
}

// GetRooms returns the list of rooms and occupancy status for the interactive map
func (h *HousingHandler) GetRooms(w http.ResponseWriter, r *http.Request) {
	buildingID := chi.URLParam(r, "buildingId")
	rooms, err := h.svc.GetRoomsByBuilding(r.Context(), buildingID)
	if err != nil {
		http.Error(w, "Failed to fetch rooms", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, rooms)
}

// AllocateRoom assigns a student to a room/bed
func (h *HousingHandler) AllocateRoom(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ApplicationID string `json:"application_id"`
		RoomID        string `json:"room_id"`
		ResidentID    string `json:"resident_id"`
		LeaseStart    string `json:"lease_start"`
		LeaseEnd      string `json:"lease_end"`
	}

	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.AllocateRoom(r.Context(), req.ApplicationID, req.RoomID, req.ResidentID, req.LeaseStart, req.LeaseEnd)
	if err != nil {
		http.Error(w, "Failed to allocate room", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Room successfully allocated"})
}

// GetMyInvoices returns the pending rent invoices for the logged-in resident
func (h *HousingHandler) GetMyInvoices(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	invoices, err := h.svc.GetPendingInvoices(r.Context(), id.String())
	if err != nil {
		http.Error(w, "Failed to fetch invoices", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, invoices)
}
