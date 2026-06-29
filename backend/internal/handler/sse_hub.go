package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sadaqah/backend/internal/model"
)

type SSEClient struct {
	ID       string
	UserID   uuid.UUID
	Messages chan model.Notification
}

type SSEHub struct {
	clients map[string]*SSEClient
	mu      sync.RWMutex
	logger  *slog.Logger
	rdb     *redis.Client
	pubsub  *redis.PubSub
}

func NewSSEHub(rdb *redis.Client, logger *slog.Logger) *SSEHub {
	return &SSEHub{
		clients: make(map[string]*SSEClient),
		logger:  logger,
		rdb:     rdb,
	}
}

func (h *SSEHub) Start(ctx context.Context) {
	h.pubsub = h.rdb.Subscribe(ctx, "sse.notifications")
	ch := h.pubsub.Channel()

	go func() {
		for {
			select {
			case <-ctx.Done():
				h.pubsub.Close()
				h.logger.Info("SSE Hub stopped")
				return
			case msg := <-ch:
				var notif model.Notification
				if err := json.Unmarshal([]byte(msg.Payload), &notif); err != nil {
					h.logger.Error("Failed to unmarshal SSE notification", "error", err)
					continue
				}

				h.BroadcastToUser(notif.UserID, notif)
			}
		}
	}()
	h.logger.Info("SSE Hub started")
}

func (h *SSEHub) AddClient(client *SSEClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[client.ID] = client
	h.logger.Debug("SSE client connected", "client_id", client.ID, "user_id", client.UserID)
}

func (h *SSEHub) RemoveClient(client *SSEClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[client.ID]; ok {
		delete(h.clients, client.ID)
		close(client.Messages)
		h.logger.Debug("SSE client disconnected", "client_id", client.ID, "user_id", client.UserID)
	}
}

func (h *SSEHub) BroadcastToUser(userID uuid.UUID, notif model.Notification) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Messages <- notif:
			default:
				// Channel full, drop message for this client
				h.logger.Warn("Dropped SSE message for client", "client_id", client.ID)
			}
		}
	}
}

func (h *SSEHub) ServeHTTP(w http.ResponseWriter, r *http.Request, userID uuid.UUID) {
	// SSE Headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	client := &SSEClient{
		ID:       uuid.NewString(),
		UserID:   userID,
		Messages: make(chan model.Notification, 100),
	}

	h.AddClient(client)
	defer h.RemoveClient(client)

	// Send an initial heartbeat/connection success
	fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"ok\"}\n\n")
	flusher.Flush()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			// Send heartbeat
			fmt.Fprintf(w, "event: heartbeat\ndata: {}\n\n")
			flusher.Flush()
		case notif, ok := <-client.Messages:
			if !ok {
				return
			}
			b, err := json.Marshal(notif)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "event: notification\ndata: %s\n\n", string(b))
			flusher.Flush()
		}
	}
}
