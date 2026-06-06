package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

// PublicRateLimit implements a strict sliding-window rate limit using Redis.
// It limits requests to 'limit' per 'window' duration per IP address.
func PublicRateLimit(rdb *redis.Client, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract IP Address (trusting the reverse proxy / RealIP middleware)
			ip := r.RemoteAddr
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = forwarded
			}

			// Key for the sliding window: rate_limit:public:<ip>
			key := fmt.Sprintf("rate_limit:public:%s", ip)
			ctx := r.Context()

			// Check if IP is banned FIRST
			banKey := fmt.Sprintf("rate_limit:banned:%s", ip)
			if rdb.Exists(ctx, banKey).Val() > 0 {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error": map[string]interface{}{
						"code":    "IP_BANNED",
						"message": "Your IP has been temporarily banned due to abuse.",
					},
				})
				return
			}

			now := time.Now().UnixNano()
			windowStart := now - window.Nanoseconds()

			// Redis Transaction:
			// 1. Remove old requests outside the window
			// 2. Count requests inside the window
			// 3. Add current request
			// 4. Set expiration on the key to avoid memory leaks
			pipe := rdb.TxPipeline()
			pipe.ZRemRangeByScore(ctx, key, "-inf", fmt.Sprintf("%d", windowStart))
			countCmd := pipe.ZCard(ctx, key)
			pipe.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: now})
			pipe.Expire(ctx, key, window)

			_, err := pipe.Exec(ctx)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			count := countCmd.Val()

			if int(count) >= limit {
				// Increment violations
				violationKey := fmt.Sprintf("rate_limit:violations:%s", ip)
				violations := rdb.Incr(ctx, violationKey).Val()
				rdb.Expire(ctx, violationKey, 1*time.Hour)

				if violations >= 5 {
					// Ban IP for 1 hour
					rdb.Set(ctx, banKey, "1", 1*time.Hour)
				}

				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
				w.WriteHeader(http.StatusTooManyRequests)
				
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error": map[string]interface{}{
						"code":    "RATE_LIMIT_EXCEEDED",
						"message": "Too many requests. Please try again later.",
					},
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
