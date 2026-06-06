package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockPermissionResolver is a mock implementation of PermissionResolver
type MockPermissionResolver struct {
	mock.Mock
}

func (m *MockPermissionResolver) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]string), args.Error(1)
}

func TestRequirePermission(t *testing.T) {
	// Setup mock handler
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success"))
	})

	userID := uuid.New()

	tests := []struct {
		name               string
		contextUserID      *uuid.UUID
		contextRoles       []string
		mockPermissions    []string
		mockError          error
		requiredPerms      []string
		expectedStatusCode int
	}{
		{
			name:               "No user in context",
			contextUserID:      nil,
			contextRoles:       nil,
			requiredPerms:      []string{"users.read"},
			expectedStatusCode: http.StatusForbidden,
		},
		{
			name:               "Super Admin bypasses check",
			contextUserID:      &userID,
			contextRoles:       []string{"super_admin"},
			requiredPerms:      []string{"some.permission"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "User has required permission",
			contextUserID:      &userID,
			contextRoles:       []string{"admin"},
			mockPermissions:    []string{"users.read", "roles.read"},
			requiredPerms:      []string{"users.read"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "User has one of required permissions",
			contextUserID:      &userID,
			contextRoles:       []string{"student"},
			mockPermissions:    []string{"scholarships.read"},
			requiredPerms:      []string{"scholarships.create", "scholarships.read"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "User lacks required permission",
			contextUserID:      &userID,
			contextRoles:       []string{"student"},
			mockPermissions:    []string{"scholarships.read"},
			requiredPerms:      []string{"scholarships.create"},
			expectedStatusCode: http.StatusForbidden,
		},
		{
			name:               "Empty permissions returned from resolver",
			contextUserID:      &userID,
			contextRoles:       []string{"user"},
			mockPermissions:    []string{},
			requiredPerms:      []string{"users.read"},
			expectedStatusCode: http.StatusForbidden,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			resolver := new(MockPermissionResolver)
			if tc.contextUserID != nil && len(tc.contextRoles) > 0 && tc.contextRoles[0] != "super_admin" {
				resolver.On("GetUserPermissions", mock.Anything, *tc.contextUserID).Return(tc.mockPermissions, tc.mockError)
			}

			middleware := RequirePermission(resolver, tc.requiredPerms...)
			handler := middleware(nextHandler)

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.contextUserID != nil {
				ctx := context.WithValue(req.Context(), userIDKey, *tc.contextUserID)
				ctx = context.WithValue(ctx, userRolesKey, tc.contextRoles)
				req = req.WithContext(ctx)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			assert.Equal(t, tc.expectedStatusCode, rr.Code)
			resolver.AssertExpectations(t)
		})
	}
}
