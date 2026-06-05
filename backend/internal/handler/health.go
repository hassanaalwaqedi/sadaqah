package handler

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// HealthHandler handles health check requests.
type HealthHandler struct {
	pool *pgxpool.Pool
	rdb  *redis.Client
}

// NewHealthHandler creates a new HealthHandler.
func NewHealthHandler(pool *pgxpool.Pool, rdb *redis.Client) *HealthHandler {
	return &HealthHandler{pool: pool, rdb: rdb}
}

// Health handles GET /api/v1/health
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Check PostgreSQL
	dbStatus := "ok"
	if err := h.pool.Ping(ctx); err != nil {
		dbStatus = "error: " + err.Error()
	}

	// Check Redis
	redisStatus := "ok"
	if err := h.rdb.Ping(ctx).Err(); err != nil {
		redisStatus = "error: " + err.Error()
	}

	status := http.StatusOK
	overallStatus := "healthy"
	if dbStatus != "ok" || redisStatus != "ok" {
		status = http.StatusServiceUnavailable
		overallStatus = "unhealthy"
	}

	writeJSON(w, status, map[string]interface{}{
		"status": overallStatus,
		"services": map[string]string{
			"database": dbStatus,
			"redis":    redisStatus,
		},
	})
}
