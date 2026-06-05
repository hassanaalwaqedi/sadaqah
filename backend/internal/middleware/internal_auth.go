package middleware

import (
	"net/http"

	"github.com/sadaqah/backend/internal/config"
	"github.com/sadaqah/backend/internal/handler"
)

// InternalAPIKey requires a valid X-Internal-API-Key header.
func InternalAPIKey(cfg config.AIConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.Header.Get("X-Internal-API-Key")
			if key == "" || key != cfg.InternalAPIKey {
				http.Error(w, `{"error":{"code":"UNAUTHORIZED","message":"Invalid internal API key"}}`, http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
