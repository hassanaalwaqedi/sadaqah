package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	UserIDKey    contextKey = "user_id"
	UserEmailKey contextKey = "user_email"
	UserRolesKey contextKey = "user_roles"
)

// JWTClaims are the custom JWT claims.
type JWTClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Roles  []string  `json:"roles"`
	jwt.RegisteredClaims
}

// JWTAuth is middleware that validates JWT access tokens.
func JWTAuth(accessSecret string, rdb *redis.Client, logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeAuthError(w, "Missing authorization header")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				writeAuthError(w, "Invalid authorization header format")
				return
			}

			tokenString := parts[1]

			// Parse and validate the JWT
			claims := &JWTClaims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return []byte(accessSecret), nil
			})

			if err != nil || !token.Valid {
				logger.Warn("invalid JWT",
					slog.String("request_id", GetRequestID(r.Context())),
					slog.Any("error", err),
				)
				writeAuthError(w, "Invalid or expired token")
				return
			}

			// Check if token is blacklisted
			blacklisted, err := rdb.Exists(r.Context(), "blacklist:"+tokenString).Result()
			if err != nil {
				logger.Error("redis blacklist check failed", slog.Any("error", err))
				// Fail open in case of Redis issues (degraded mode)
			} else if blacklisted > 0 {
				writeAuthError(w, "Token has been revoked")
				return
			}

			// Inject user info into context
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
			ctx = context.WithValue(ctx, UserRolesKey, claims.Roles)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// OptionalJWTAuth extracts user info from JWT if present, but does not require it.
func OptionalJWTAuth(accessSecret string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				next.ServeHTTP(w, r)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				next.ServeHTTP(w, r)
				return
			}

			claims := &JWTClaims{}
			token, err := jwt.ParseWithClaims(parts[1], claims, func(t *jwt.Token) (interface{}, error) {
				return []byte(accessSecret), nil
			})

			if err == nil && token.Valid {
				ctx := r.Context()
				ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
				ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
				ctx = context.WithValue(ctx, UserRolesKey, claims.Roles)
				r = r.WithContext(ctx)
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserID extracts the user ID from the context.
func GetUserID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return id, ok
}

// GetUserEmail extracts the user email from the context.
func GetUserEmail(ctx context.Context) string {
	email, _ := ctx.Value(UserEmailKey).(string)
	return email
}

// GetUserRoles extracts the user roles from the context.
func GetUserRoles(ctx context.Context) []string {
	roles, _ := ctx.Value(UserRolesKey).([]string)
	return roles
}

// RequireRoles returns middleware that checks if the user has at least one of the specified roles.
func RequireRoles(roles ...string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRoles := GetUserRoles(r.Context())
			if len(userRoles) == 0 {
				writeForbiddenError(w)
				return
			}

			roleSet := make(map[string]bool, len(roles))
			for _, role := range roles {
				roleSet[role] = true
			}

			for _, userRole := range userRoles {
				if roleSet[userRole] {
					next.ServeHTTP(w, r)
					return
				}
			}

			// Super admin always passes
			for _, userRole := range userRoles {
				if userRole == "super_admin" {
					next.ServeHTTP(w, r)
					return
				}
			}

			writeForbiddenError(w)
		})
	}
}

// GenerateAccessToken creates a new JWT access token.
func GenerateAccessToken(userID uuid.UUID, email string, roles []string, secret string, expiry time.Duration) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "sadaqah",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateRefreshToken creates a cryptographically random refresh token.
func GenerateRefreshToken() string {
	return uuid.New().String() + "-" + uuid.New().String()
}

// ── Error helpers ──

func writeAuthError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error": map[string]interface{}{
			"code":      "UNAUTHORIZED",
			"message":   message,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func writeForbiddenError(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error": map[string]interface{}{
			"code":      "FORBIDDEN",
			"message":   "You do not have permission to access this resource",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}
