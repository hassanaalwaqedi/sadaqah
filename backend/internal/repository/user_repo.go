package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sadaqah/backend/internal/model"
)

// UserRepository handles user data access.
type UserRepository struct {
	pool *pgxpool.Pool
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

// Create inserts a new user into the database.
func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, email_verified, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.pool.Exec(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.EmailVerified, user.IsActive, user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting user: %w", err)
	}
	return nil
}

// GetByID retrieves a user by ID.
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	query := `
		SELECT id, email, password_hash, email_verified, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL`

	user := &model.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.EmailVerified,
		&user.IsActive, &user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("querying user by id: %w", err)
	}
	return user, nil
}

// GetByEmail retrieves a user by email.
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, email, password_hash, email_verified, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE email = $1 AND deleted_at IS NULL`

	user := &model.User{}
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.EmailVerified,
		&user.IsActive, &user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("querying user by email: %w", err)
	}
	return user, nil
}

// UpdateLastLogin updates the last login timestamp.
func (r *UserRepository) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE users SET last_login_at = $1, updated_at = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, time.Now().UTC(), id)
	return err
}

// SoftDelete sets the deleted_at timestamp on a user.
func (r *UserRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE users SET deleted_at = $1, is_active = false, updated_at = $1 WHERE id = $2 AND deleted_at IS NULL`
	_, err := r.pool.Exec(ctx, query, time.Now().UTC(), id)
	return err
}

// List returns a paginated list of users.
func (r *UserRepository) List(ctx context.Context, params model.PaginationParams) ([]model.User, int64, error) {
	countQuery := `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL`
	dataQuery := `
		SELECT id, email, password_hash, email_verified, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE deleted_at IS NULL`

	// Add search filter
	args := []interface{}{}
	argIdx := 1
	if params.Search != "" {
		filter := fmt.Sprintf(" AND (email ILIKE $%d)", argIdx)
		countQuery += filter
		dataQuery += filter
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	// Count total
	var total int64
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting users: %w", err)
	}

	// Add ordering and pagination
	orderCol := "created_at"
	if params.Sort == "email" {
		orderCol = "email"
	}
	orderDir := "DESC"
	if params.Order == "asc" {
		orderDir = "ASC"
	}
	dataQuery += fmt.Sprintf(" ORDER BY %s %s", orderCol, orderDir)
	offset := (params.Page - 1) * params.PageSize
	dataQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.PageSize, offset)

	// Fetch rows
	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("querying users: %w", err)
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(
			&u.ID, &u.Email, &u.PasswordHash, &u.EmailVerified,
			&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scanning user: %w", err)
		}
		users = append(users, u)
	}

	return users, total, nil
}

// ── Profile ──

// CreateProfile inserts a new user profile.
func (r *UserRepository) CreateProfile(ctx context.Context, p *model.UserProfile) error {
	query := `
		INSERT INTO user_profiles (user_id, first_name_en, first_name_ar, last_name_en, last_name_ar, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.pool.Exec(ctx, query,
		p.UserID, p.FirstNameEN, p.FirstNameAR, p.LastNameEN, p.LastNameAR, p.CreatedAt, p.UpdatedAt,
	)
	return err
}

// GetProfile retrieves a user profile by user ID.
func (r *UserRepository) GetProfile(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error) {
	query := `
		SELECT user_id, first_name_en, first_name_ar, last_name_en, last_name_ar,
		       phone, date_of_birth, gender, nationality, national_id,
		       university, major, gpa, academic_year, avatar_file_id, address, bio,
		       created_at, updated_at
		FROM user_profiles
		WHERE user_id = $1`

	p := &model.UserProfile{}
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&p.UserID, &p.FirstNameEN, &p.FirstNameAR, &p.LastNameEN, &p.LastNameAR,
		&p.Phone, &p.DateOfBirth, &p.Gender, &p.Nationality, &p.NationalID,
		&p.University, &p.Major, &p.GPA, &p.AcademicYear, &p.AvatarFileID, &p.Address, &p.Bio,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("querying profile: %w", err)
	}
	return p, nil
}

// ── Roles ──

// GetUserRoles retrieves all roles for a user.
func (r *UserRepository) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]model.Role, error) {
	query := `
		SELECT r.id, r.name, r.display_name_en, r.display_name_ar, r.description, r.is_system, r.created_at
		FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("querying user roles: %w", err)
	}
	defer rows.Close()

	var roles []model.Role
	for rows.Next() {
		var role model.Role
		if err := rows.Scan(
			&role.ID, &role.Name, &role.DisplayNameEN, &role.DisplayNameAR,
			&role.Description, &role.IsSystem, &role.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning role: %w", err)
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// GetUserRoleNames returns just the role name strings for a user.
func (r *UserRepository) GetUserRoleNames(ctx context.Context, userID uuid.UUID) ([]string, error) {
	query := `
		SELECT r.name
		FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("querying user role names: %w", err)
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, fmt.Errorf("scanning role name: %w", err)
		}
		names = append(names, name)
	}
	return names, nil
}

// AssignRole assigns a role to a user.
func (r *UserRepository) AssignRole(ctx context.Context, userID, roleID, assignedBy uuid.UUID) error {
	query := `
		INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, role_id) DO NOTHING`

	_, err := r.pool.Exec(ctx, query, userID, roleID, assignedBy, time.Now().UTC())
	return err
}

// GetRoleByName retrieves a role by its name.
func (r *UserRepository) GetRoleByName(ctx context.Context, name string) (*model.Role, error) {
	query := `
		SELECT id, name, display_name_en, display_name_ar, description, is_system, created_at
		FROM roles WHERE name = $1`

	role := &model.Role{}
	err := r.pool.QueryRow(ctx, query, name).Scan(
		&role.ID, &role.Name, &role.DisplayNameEN, &role.DisplayNameAR,
		&role.Description, &role.IsSystem, &role.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("querying role by name: %w", err)
	}
	return role, nil
}

// ── Refresh Tokens ──

// SaveRefreshToken stores a refresh token.
func (r *UserRepository) SaveRefreshToken(ctx context.Context, rt *model.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at, user_agent, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.pool.Exec(ctx, query,
		rt.ID, rt.UserID, rt.TokenHash, rt.ExpiresAt, rt.Revoked,
		rt.CreatedAt, rt.UserAgent, rt.IPAddress,
	)
	return err
}

// GetRefreshTokenByHash retrieves a refresh token by its hash.
func (r *UserRepository) GetRefreshTokenByHash(ctx context.Context, hash string) (*model.RefreshToken, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, revoked, created_at, user_agent, ip_address
		FROM refresh_tokens
		WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`

	rt := &model.RefreshToken{}
	err := r.pool.QueryRow(ctx, query, hash).Scan(
		&rt.ID, &rt.UserID, &rt.TokenHash, &rt.ExpiresAt,
		&rt.Revoked, &rt.CreatedAt, &rt.UserAgent, &rt.IPAddress,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("querying refresh token: %w", err)
	}
	return rt, nil
}

// RevokeRefreshToken marks a refresh token as revoked.
func (r *UserRepository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// RevokeAllUserRefreshTokens revokes all refresh tokens for a user.
func (r *UserRepository) RevokeAllUserRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false`
	_, err := r.pool.Exec(ctx, query, userID)
	return err
}

// ── Login Attempts ──

// RecordLoginAttempt records a login attempt.
func (r *UserRepository) RecordLoginAttempt(ctx context.Context, attempt *model.LoginAttempt) error {
	query := `
		INSERT INTO login_attempts (id, email, ip_address, success, attempted_at, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := r.pool.Exec(ctx, query,
		attempt.ID, attempt.Email, attempt.IPAddress, attempt.Success,
		attempt.AttemptedAt, attempt.UserAgent,
	)
	return err
}

// CountRecentFailedAttempts counts failed login attempts in the last duration.
func (r *UserRepository) CountRecentFailedAttempts(ctx context.Context, email string, since time.Time) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM login_attempts
		WHERE email = $1 AND success = false AND attempted_at > $2`

	var count int
	err := r.pool.QueryRow(ctx, query, email, since).Scan(&count)
	return count, err
}

// ── Audit Log ──

// CreateAuditLog inserts an audit log entry.
func (r *UserRepository) CreateAuditLog(ctx context.Context, log *model.AuditLog) error {
	query := `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.pool.Exec(ctx, query,
		log.ID, log.UserID, log.Action, log.EntityType, log.EntityID,
		log.OldValues, log.NewValues, log.IPAddress, log.UserAgent, log.CreatedAt,
	)
	return err
}

// EmailExists checks if an email is already registered.
func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)`
	var exists bool
	err := r.pool.QueryRow(ctx, query, email).Scan(&exists)
	return exists, err
}

// SetEmailVerified marks a user's email as verified.
func (r *UserRepository) SetEmailVerified(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE users SET email_verified = true, updated_at = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, time.Now().UTC(), userID)
	return err
}
