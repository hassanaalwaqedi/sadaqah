package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
	"github.com/sadaqah/backend/internal/service"
)

type PublicHandler struct {
	svc *service.CoreOpsService
	rdb *redis.Client
}

func NewPublicHandler(svc *service.CoreOpsService, rdb *redis.Client) *PublicHandler {
	return &PublicHandler{
		svc: svc,
		rdb: rdb,
	}
}

// GetCampaignByID handles GET /api/v1/public/campaigns/{id}
func (h *PublicHandler) GetCampaignByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Campaign ID is required", http.StatusBadRequest)
		return
	}

	campaign, err := h.svc.GetCampaignByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Campaign not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, campaign)
}

// GetMetrics handles GET /api/v1/public/metrics with Redis caching
func (h *PublicHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	cacheKey := "public:metrics"

	// 1. Try to fetch from Redis cache
	cachedMetrics, err := h.rdb.Get(ctx, cacheKey).Result()
	if err == nil && cachedMetrics != "" {
		// Cache hit! Return directly
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(cachedMetrics))
		return
	}

	// 2. Cache miss. Fetch from PostgreSQL
	studentCount, totalDonations, err := h.svc.GetPublicMetrics(ctx)
	if err != nil {
		http.Error(w, "Failed to compute metrics", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"active_students": studentCount,
		"funds_raised":    totalDonations,
		"updated_at":      time.Now().UTC().Format(time.RFC3339),
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

	// 3. Store in Redis with 15-minute TTL
	err = h.rdb.Set(ctx, cacheKey, responseBytes, 15*time.Minute).Err()
	if err != nil {
		// Log error but don't fail the request (degraded cache mode)
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(responseBytes)
}
