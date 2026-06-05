package model

import "github.com/google/uuid"

// ── Auth DTOs ──

// RegisterRequest is the request body for user registration.
type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstNameEN string `json:"first_name_en"`
	LastNameEN  string `json:"last_name_en"`
	FirstNameAR string `json:"first_name_ar,omitempty"`
	LastNameAR  string `json:"last_name_ar,omitempty"`
}

// LoginRequest is the request body for user login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// TokenResponse is returned after successful login or token refresh.
type TokenResponse struct {
	AccessToken  string          `json:"access_token"`
	TokenType    string          `json:"token_type"`
	ExpiresIn    int64           `json:"expires_in"`
	User         UserWithProfile `json:"user"`
}

// RefreshRequest is the request body for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// ForgotPasswordRequest is the request body for forgot password.
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ResetPasswordRequest is the request body for password reset.
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// VerifyEmailRequest is the request body for email verification.
type VerifyEmailRequest struct {
	Token string `json:"token"`
}

// ── User DTOs ──

// UpdateProfileRequest is the request body for profile updates.
type UpdateProfileRequest struct {
	FirstNameEN  *string  `json:"first_name_en,omitempty"`
	FirstNameAR  *string  `json:"first_name_ar,omitempty"`
	LastNameEN   *string  `json:"last_name_en,omitempty"`
	LastNameAR   *string  `json:"last_name_ar,omitempty"`
	Phone        *string  `json:"phone,omitempty"`
	Gender       *string  `json:"gender,omitempty"`
	Nationality  *string  `json:"nationality,omitempty"`
	NationalID   *string  `json:"national_id,omitempty"`
	University   *string  `json:"university,omitempty"`
	Major        *string  `json:"major,omitempty"`
	GPA          *float64 `json:"gpa,omitempty"`
	AcademicYear *int     `json:"academic_year,omitempty"`
	Address      *string  `json:"address,omitempty"`
	Bio          *string  `json:"bio,omitempty"`
}

// AssignRolesRequest is the request body for role assignment.
type AssignRolesRequest struct {
	RoleIDs []uuid.UUID `json:"role_ids"`
}

// CreateUserRequest is the admin request to create a user.
type CreateUserRequest struct {
	Email       string   `json:"email"`
	Password    string   `json:"password"`
	FirstNameEN string   `json:"first_name_en"`
	LastNameEN  string   `json:"last_name_en"`
	FirstNameAR string   `json:"first_name_ar,omitempty"`
	LastNameAR  string   `json:"last_name_ar,omitempty"`
	RoleNames   []string `json:"role_names,omitempty"`
}

// ── Common DTOs ──

// PaginationParams are query parameters for paginated lists.
type PaginationParams struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	Sort     string `json:"sort,omitempty"`
	Order    string `json:"order,omitempty"` // asc | desc
	Search   string `json:"search,omitempty"`
}

// PaginatedResponse wraps paginated data.
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

// APIError is the standard error response.
type APIError struct {
	Code      string        `json:"code"`
	Message   string        `json:"message"`
	Details   []FieldError  `json:"details,omitempty"`
	RequestID string        `json:"request_id,omitempty"`
	Timestamp string        `json:"timestamp"`
}

// FieldError describes a validation error on a specific field.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// SuccessResponse is a generic success wrapper.
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// DefaultPagination returns default pagination parameters.
func DefaultPagination() PaginationParams {
	return PaginationParams{
		Page:     1,
		PageSize: 20,
		Sort:     "created_at",
		Order:    "desc",
	}
}
