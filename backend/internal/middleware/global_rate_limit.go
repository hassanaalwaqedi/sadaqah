package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// GlobalRateLimit provides a fallback rate limit for all routes.
// Individual route groups (e.g., /auth, /public) may have stricter limits.
func GlobalRateLimit() func(http.Handler) http.Handler {
	return httprate.LimitByIP(100, 1*time.Minute)
}
