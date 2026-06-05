package model

import (
	"time"

	"github.com/google/uuid"
)

// ── User ──

type User struct {
	ID            uuid.UUID  `json:"id"`
	Email         string     `json:"email"`
	PasswordHash  string     `json:"-"`
	EmailVerified bool       `json:"email_verified"`
	IsActive      bool       `json:"is_active"`
	LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"-"`
}

// UserProfile holds extended profile information.
type UserProfile struct {
	UserID       uuid.UUID  `json:"user_id"`
	FirstNameEN  string     `json:"first_name_en"`
	FirstNameAR  *string    `json:"first_name_ar,omitempty"`
	LastNameEN   string     `json:"last_name_en"`
	LastNameAR   *string    `json:"last_name_ar,omitempty"`
	Phone        *string    `json:"phone,omitempty"`
	DateOfBirth  *time.Time `json:"date_of_birth,omitempty"`
	Gender       *string    `json:"gender,omitempty"`
	Nationality  *string    `json:"nationality,omitempty"`
	NationalID   *string    `json:"national_id,omitempty"`
	University   *string    `json:"university,omitempty"`
	Major        *string    `json:"major,omitempty"`
	GPA          *float64   `json:"gpa,omitempty"`
	AcademicYear *int       `json:"academic_year,omitempty"`
	AvatarFileID *uuid.UUID `json:"avatar_file_id,omitempty"`
	Address      *string    `json:"address,omitempty"`
	Bio          *string    `json:"bio,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// UserWithProfile combines user and profile data for API responses.
type UserWithProfile struct {
	User
	Profile *UserProfile `json:"profile,omitempty"`
	Roles   []Role       `json:"roles,omitempty"`
}

// ── Role & Permission ──

type Role struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	DisplayNameEN string    `json:"display_name_en"`
	DisplayNameAR string    `json:"display_name_ar"`
	Description   *string   `json:"description,omitempty"`
	IsSystem      bool      `json:"is_system"`
	CreatedAt     time.Time `json:"created_at"`
}

type Permission struct {
	ID          uuid.UUID `json:"id"`
	Resource    string    `json:"resource"`
	Action      string    `json:"action"`
	Description *string   `json:"description,omitempty"`
}

type UserRole struct {
	UserID     uuid.UUID `json:"user_id"`
	RoleID     uuid.UUID `json:"role_id"`
	AssignedBy uuid.UUID `json:"assigned_by"`
	AssignedAt time.Time `json:"assigned_at"`
}

type RolePermission struct {
	RoleID       uuid.UUID `json:"role_id"`
	PermissionID uuid.UUID `json:"permission_id"`
}

// ── Auth ──

type RefreshToken struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	TokenHash string     `json:"-"`
	ExpiresAt time.Time  `json:"expires_at"`
	Revoked   bool       `json:"revoked"`
	CreatedAt time.Time  `json:"created_at"`
	UserAgent *string    `json:"user_agent,omitempty"`
	IPAddress *string    `json:"ip_address,omitempty"`
}

type LoginAttempt struct {
	ID          uuid.UUID `json:"id"`
	Email       string    `json:"email"`
	IPAddress   string    `json:"ip_address"`
	Success     bool      `json:"success"`
	AttemptedAt time.Time `json:"attempted_at"`
	UserAgent   *string   `json:"user_agent,omitempty"`
}

// ── Audit ──

type AuditLog struct {
	ID         uuid.UUID              `json:"id"`
	UserID     *uuid.UUID             `json:"user_id,omitempty"`
	Action     string                 `json:"action"`
	EntityType string                 `json:"entity_type"`
	EntityID   uuid.UUID              `json:"entity_id"`
	OldValues  map[string]interface{} `json:"old_values,omitempty"`
	NewValues  map[string]interface{} `json:"new_values,omitempty"`
	IPAddress  *string                `json:"ip_address,omitempty"`
	UserAgent  *string                `json:"user_agent,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
}

// ── Notifications ──

type Notification struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"user_id"`
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Body      string                 `json:"body"`
	Data      map[string]interface{} `json:"data,omitempty"`
	IsRead    bool                   `json:"is_read"`
	ReadAt    *time.Time             `json:"read_at,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
}

// ── Files ──

type File struct {
	ID             uuid.UUID  `json:"id"`
	OriginalName   string     `json:"original_name"`
	StoredName     string     `json:"stored_name"`
	MimeType       string     `json:"mime_type"`
	SizeBytes      int64      `json:"size_bytes"`
	StoragePath    string     `json:"-"`
	StorageBackend string     `json:"-"`
	UploadedBy     uuid.UUID  `json:"uploaded_by"`
	UploadedAt     time.Time  `json:"uploaded_at"`
	DeletedAt      *time.Time `json:"-"`
}
