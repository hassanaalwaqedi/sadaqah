package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) GetMyNotifications(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	notifications, err := h.svc.GetMyNotifications(r.Context(), userID.String())
	if err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	if notifications == nil {
		notifications = []model.Notification{} // Return empty array instead of null
	}

	writeJSON(w, http.StatusOK, notifications)
}

func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	notificationID := chi.URLParam(r, "id")
	if notificationID == "" {
		http.Error(w, "Missing notification ID", http.StatusBadRequest)
		return
	}

	err := h.svc.MarkAsRead(r.Context(), notificationID, userID.String())
	if err != nil {
		http.Error(w, "Failed to mark notification as read", http.StatusInternalServerError)
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

	err := h.svc.MarkAllAsRead(r.Context(), userID.String())
	if err != nil {
		http.Error(w, "Failed to mark all notifications as read", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
