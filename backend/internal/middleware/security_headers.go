package middleware

import "net/http"

// SecurityHeaders injects production-grade HTTP security headers into every response.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		w.Header().Set("X-Frame-Options", "DENY")

		// Enable XSS filtering in legacy browsers
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// Enforce HTTPS for 1 year (including subdomains)
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// Restrict referrer information
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict browser features
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		// Basic Content Security Policy (API server — no inline scripts)
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; script-src 'none'; style-src 'none';")

		// Prevent caching of authenticated responses
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Pragma", "no-cache")

		next.ServeHTTP(w, r)
	})
}
