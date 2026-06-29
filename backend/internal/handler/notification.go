package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

type NotificationHandler struct {
	svc *service.NotificationService
	hub *SSEHub
}

func NewNotificationHandler(svc *service.NotificationService, hub *SSEHub) *NotificationHandler {
	return &NotificationHandler{
		svc: svc,
		hub: hub,
	}
}

// Stream Handles Server-Sent Events connection
func (h *NotificationHandler) Stream(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	h.hub.ServeHTTP(w, r, userID)
}

func (h *NotificationHandler) GetMyNotifications(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	limit := 50
	offset := 0
	unreadOnly := false

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}
	if u := r.URL.Query().Get("unread"); u == "true" {
		unreadOnly = true
	}

	notifs, total, err := h.svc.GetUserNotifications(r.Context(), userID.String(), limit, offset, unreadOnly)
	if err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"notifications": notifs,
		"total":         total,
	})
}

func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id := chi.URLParam(r, "id")
	if err := h.svc.MarkAsRead(r.Context(), id, userID.String()); err != nil {
		http.Error(w, "Failed to mark as read", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *NotificationHandler) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.svc.MarkAllAsRead(r.Context(), userID.String()); err != nil {
		http.Error(w, "Failed to mark all as read", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *NotificationHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	prefs, err := h.svc.GetPreferences(r.Context(), userID.String())
	if err != nil {
		http.Error(w, "Failed to fetch preferences", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, prefs)
}

func (h *NotificationHandler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req model.NotificationPreference
	if err := parseJSON(r, &req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if err := h.svc.UpdatePreferences(r.Context(), userID.String(), &req); err != nil {
		http.Error(w, "Failed to update preferences", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, req)
}
