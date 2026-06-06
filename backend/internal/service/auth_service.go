package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"

	"github.com/sadaqah/backend/internal/config"
	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/repository"
)

var (
	ErrEmailAlreadyExists    = errors.New("email already exists")
	ErrInvalidCredentials    = errors.New("invalid email or password")
	ErrAccountLocked         = errors.New("account temporarily locked due to too many failed attempts")
	ErrAccountInactive       = errors.New("account is inactive")
	ErrInvalidRefreshToken   = errors.New("invalid or expired refresh token")
	ErrUserNotFound          = errors.New("user not found")
)

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo     *repository.UserRepository
	rdb          *redis.Client
	cfg          config.JWTConfig
	emailService *EmailService
	logger       *slog.Logger
}

// NewAuthService creates a new AuthService.
func NewAuthService(
	userRepo *repository.UserRepository,
	rdb *redis.Client,
	cfg config.JWTConfig,
	emailService *EmailService,
	logger *slog.Logger,
) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		rdb:          rdb,
		cfg:          cfg,
		emailService: emailService,
		logger:       logger,
	}
}

// Register creates a new user account.
func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.TokenResponse, error) {
	// Normalize email
	email := strings.ToLower(strings.TrimSpace(req.Email))

	// Check if email exists
	exists, err := s.userRepo.EmailExists(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("checking email: %w", err)
	}
	if exists {
		return nil, ErrEmailAlreadyExists
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}

	now := time.Now().UTC()
	userID := uuid.New()

	hashStr := string(hash)

	// Create user
	user := &model.User{
		ID:            userID,
		Email:         email,
		PasswordHash:  &hashStr,
		EmailVerified: false,
		IsActive:      true,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("creating user: %w", err)
	}

	// Create profile
	profile := &model.UserProfile{
		UserID:      userID,
		FirstNameEN: req.FirstNameEN,
		LastNameEN:  req.LastNameEN,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if req.FirstNameAR != "" {
		profile.FirstNameAR = &req.FirstNameAR
	}
	if req.LastNameAR != "" {
		profile.LastNameAR = &req.LastNameAR
	}

	if err := s.userRepo.CreateProfile(ctx, profile); err != nil {
		return nil, fmt.Errorf("creating profile: %w", err)
	}

	// Assign default "student" role
	studentRole, err := s.userRepo.GetRoleByName(ctx, "student")
	if err != nil {
		s.logger.Warn("failed to fetch student role", slog.Any("error", err))
	}
	if studentRole != nil {
		if err := s.userRepo.AssignRole(ctx, userID, studentRole.ID, userID); err != nil {
			s.logger.Warn("failed to assign student role", slog.Any("error", err))
		}
	}

	// Send Welcome Email
	if s.emailService != nil {
		name := req.FirstNameEN
		if name == "" {
			name = "User"
		}
		s.emailService.SendWelcomeEmail(email, name)
	}

	// Generate tokens
	roleNames, _ := s.userRepo.GetUserRoleNames(ctx, userID)
	return s.generateTokenResponse(ctx, user, profile, roleNames, "", "")
}

// Login authenticates a user and returns tokens.
func (s *AuthService) Login(ctx context.Context, req model.LoginRequest, ip, userAgent string) (*model.TokenResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	// Check for account lockout (too many failed attempts)
	failedCount, err := s.userRepo.CountRecentFailedAttempts(ctx, email, time.Now().UTC().Add(-15*time.Minute))
	if err != nil {
		s.logger.Error("failed to count login attempts", slog.Any("error", err))
	}
	if failedCount >= 10 {
		return nil, ErrAccountLocked
	}

	// Get user
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("querying user: %w", err)
	}
	if user == nil {
		s.recordLoginAttempt(ctx, email, ip, userAgent, false)
		return nil, ErrInvalidCredentials
	}

	// Check password (users from OAuth might not have a password hash)
	if user.PasswordHash == nil {
		s.recordLoginAttempt(ctx, email, ip, userAgent, false)
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		s.recordLoginAttempt(ctx, email, ip, userAgent, false)
		return nil, ErrInvalidCredentials
	}

	// Check active
	if !user.IsActive {
		return nil, ErrAccountInactive
	}

	// Record successful login
	s.recordLoginAttempt(ctx, email, ip, userAgent, true)
	_ = s.userRepo.UpdateLastLogin(ctx, user.ID)

	// Get profile and roles
	profile, _ := s.userRepo.GetProfile(ctx, user.ID)
	roleNames, _ := s.userRepo.GetUserRoleNames(ctx, user.ID)

	return s.generateTokenResponse(ctx, user, profile, roleNames, ip, userAgent)
}

// GoogleLogin verifies a Firebase ID token and logs the user in (or registers them if new).
func (s *AuthService) GoogleLogin(ctx context.Context, idToken, ip, userAgent string) (*model.TokenResponse, error) {
	// Firebase ID tokens are JWTs. We verify them using Google's secure token verification endpoint.
	// This endpoint accepts Firebase ID tokens (unlike oauth2.googleapis.com/tokeninfo which only accepts OAuth tokens).
	client := &http.Client{Timeout: 10 * time.Second}
	verifyURL := fmt.Sprintf("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyATw5_qnrHqD63kd0MDFoZ2fM72TkoGZxU")

	payload := fmt.Sprintf(`{"idToken":"%s"}`, idToken)
	req, err := http.NewRequestWithContext(ctx, "POST", verifyURL, strings.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to create verify request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("[DEBUG] failed to call firebase verify: %v\n", err)
		return nil, fmt.Errorf("failed to call firebase verify: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("[DEBUG] firebase verify returned status %d. Body: %s\n", resp.StatusCode, string(bodyBytes))
		return nil, errors.New("invalid firebase id token")
	}

	var result struct {
		Users []struct {
			LocalID       string `json:"localId"`
			Email         string `json:"email"`
			EmailVerified bool   `json:"emailVerified"`
			DisplayName   string `json:"displayName"`
			PhotoURL      string `json:"photoUrl"`
		} `json:"users"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode firebase response: %w", err)
	}

	if len(result.Users) == 0 || result.Users[0].Email == "" {
		return nil, errors.New("firebase token does not contain a valid user")
	}

	firebaseUser := result.Users[0]
	email := strings.ToLower(strings.TrimSpace(firebaseUser.Email))

	// Extract first/last name from display name
	givenName := firebaseUser.DisplayName
	familyName := ""
	if parts := strings.SplitN(firebaseUser.DisplayName, " ", 2); len(parts) == 2 {
		givenName = parts[0]
		familyName = parts[1]
	}

	// Find existing user by email
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("checking user by email: %w", err)
	}

	now := time.Now().UTC()

	if user == nil {
		// Create new user via Google
		userID := uuid.New()
		providerID := firebaseUser.LocalID
		avatarURL := firebaseUser.PhotoURL
		user = &model.User{
			ID:               userID,
			Email:            email,
			PasswordHash:     nil, // No password for OAuth
			Provider:         "GOOGLE",
			ProviderID:       &providerID,
			AvatarURL:        &avatarURL,
			EmailVerified:    firebaseUser.EmailVerified,
			IsActive:         true,
			ProfileCompleted: false, // Must complete onboarding wizard
			CreatedAt:        now,
			UpdatedAt:        now,
		}

		if err := s.userRepo.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("creating google user: %w", err)
		}

		// Create basic empty profile
		profile := &model.UserProfile{
			UserID:      userID,
			FirstNameEN: givenName,
			LastNameEN:  familyName,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if profile.FirstNameEN == "" {
			profile.FirstNameEN = firebaseUser.DisplayName // fallback
		}

		_ = s.userRepo.CreateProfile(ctx, profile)

		// Assign default "student" role
		studentRole, err := s.userRepo.GetRoleByName(ctx, "student")
		if err == nil && studentRole != nil {
			_ = s.userRepo.AssignRole(ctx, userID, studentRole.ID, userID)
		}
	} else {
		// Existing user logging in with Google
		if !user.IsActive {
			return nil, ErrAccountInactive
		}
	}

	// Record successful login
	s.recordLoginAttempt(ctx, email, ip, userAgent, true)
	_ = s.userRepo.UpdateLastLogin(ctx, user.ID)

	profile, _ := s.userRepo.GetProfile(ctx, user.ID)
	roleNames, _ := s.userRepo.GetUserRoleNames(ctx, user.ID)

	return s.generateTokenResponse(ctx, user, profile, roleNames, ip, userAgent)
}

// RefreshTokens generates new access and refresh tokens.
func (s *AuthService) RefreshTokens(ctx context.Context, refreshToken, ip, userAgent string) (*model.TokenResponse, error) {
	// Hash the refresh token to look it up
	tokenHash := hashToken(refreshToken)

	// Find the refresh token
	rt, err := s.userRepo.GetRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("querying refresh token: %w", err)
	}
	if rt == nil {
		return nil, ErrInvalidRefreshToken
	}

	// Revoke the old refresh token (rotation)
	if err := s.userRepo.RevokeRefreshToken(ctx, rt.ID); err != nil {
		s.logger.Error("failed to revoke refresh token", slog.Any("error", err))
	}

	// Get the user
	user, err := s.userRepo.GetByID(ctx, rt.UserID)
	if err != nil || user == nil {
		return nil, ErrUserNotFound
	}
	if !user.IsActive {
		return nil, ErrAccountInactive
	}

	profile, _ := s.userRepo.GetProfile(ctx, user.ID)
	roleNames, _ := s.userRepo.GetUserRoleNames(ctx, user.ID)

	return s.generateTokenResponse(ctx, user, profile, roleNames, ip, userAgent)
}

// Logout revokes the user's refresh tokens and blacklists the access token.
func (s *AuthService) Logout(ctx context.Context, userID uuid.UUID, accessToken string) error {
	// Blacklist the access token in Redis (for remaining TTL)
	if accessToken != "" {
		s.rdb.Set(ctx, "blacklist:"+accessToken, "1", s.cfg.AccessExpiry)
	}

	// Revoke all refresh tokens
	return s.userRepo.RevokeAllUserRefreshTokens(ctx, userID)
}

// GetCurrentUser returns the full user with profile and roles.
func (s *AuthService) GetCurrentUser(ctx context.Context, userID uuid.UUID) (*model.UserWithProfile, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("querying user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	profile, _ := s.userRepo.GetProfile(ctx, userID)
	roles, _ := s.userRepo.GetUserRoles(ctx, userID)

	return &model.UserWithProfile{
		User:    *user,
		Profile: profile,
		Roles:   roles,
	}, nil
}

// ── Internal helpers ──

func (s *AuthService) generateTokenResponse(
	ctx context.Context,
	user *model.User,
	profile *model.UserProfile,
	roles []string,
	ip, userAgent string,
) (*model.TokenResponse, error) {
	// Generate access token (pass ProfileCompleted)
	accessToken, err := middleware.GenerateAccessToken(
		user.ID, user.Email, roles, user.ProfileCompleted, s.cfg.AccessSecret, s.cfg.AccessExpiry,
	)
	if err != nil {
		return nil, fmt.Errorf("generating access token: %w", err)
	}

	// Generate and store refresh token
	refreshToken := middleware.GenerateRefreshToken()
	tokenHash := hashToken(refreshToken)

	rt := &model.RefreshToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().UTC().Add(s.cfg.RefreshExpiry),
		Revoked:   false,
		CreatedAt: time.Now().UTC(),
	}
	if userAgent != "" {
		rt.UserAgent = &userAgent
	}
	if ip != "" {
		rt.IPAddress = &ip
	}

	if err := s.userRepo.SaveRefreshToken(ctx, rt); err != nil {
		return nil, fmt.Errorf("saving refresh token: %w", err)
	}

	// Cache user roles in Redis for fast middleware lookups
	roleKey := fmt.Sprintf("user:roles:%s", user.ID.String())
	s.rdb.SAdd(ctx, roleKey, stringsToInterfaces(roles)...)
	s.rdb.Expire(ctx, roleKey, 30*time.Minute)

	// Build user response
	userWithProfile := model.UserWithProfile{User: *user}
	if profile != nil {
		userWithProfile.Profile = profile
	}

	userRoles, _ := s.userRepo.GetUserRoles(ctx, user.ID)
	userWithProfile.Roles = userRoles

	return &model.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.cfg.AccessExpiry.Seconds()),
		User:         userWithProfile,
	}, nil
}

func (s *AuthService) recordLoginAttempt(ctx context.Context, email, ip, userAgent string, success bool) {
	attempt := &model.LoginAttempt{
		ID:          uuid.New(),
		Email:       email,
		IPAddress:   ip,
		Success:     success,
		AttemptedAt: time.Now().UTC(),
	}
	if userAgent != "" {
		attempt.UserAgent = &userAgent
	}
	if err := s.userRepo.RecordLoginAttempt(ctx, attempt); err != nil {
		s.logger.Error("failed to record login attempt", slog.Any("error", err))
	}
}

func hashToken(token string) string {
	h := sha256.New()
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

func stringsToInterfaces(ss []string) []interface{} {
	result := make([]interface{}, len(ss))
	for i, s := range ss {
		result[i] = s
	}
	return result
}
