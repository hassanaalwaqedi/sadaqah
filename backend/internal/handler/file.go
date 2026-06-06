package handler

import (
	"net/http"
	"strings"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

// allowedContentTypes is the strict allowlist for file uploads.
var allowedContentTypes = map[string]bool{
	"application/pdf": true,
	"image/png":       true,
	"image/jpeg":      true,
	"image/jpg":       true,
	"image/webp":      true,
	"image/gif":       true,
}

// maxFileSizeMB is the maximum allowed file size in megabytes.
const maxFileSizeMB = 10

// FileHandler handles file upload requests.
type FileHandler struct {
	fileService *service.FileService
}

// NewFileHandler creates a new FileHandler.
func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{fileService: fileService}
}

// GetPresignedURL handles POST /api/v1/files/presigned-url
func (h *FileHandler) GetPresignedURL(w http.ResponseWriter, r *http.Request) {
	var req model.PresignedURLRequest
	if err := parseJSON(r, &req); err != nil {
		writeError(w, r, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	if req.Filename == "" || req.ContentType == "" {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Filename and content_type are required")
		return
	}

	// Validate content type against allowlist
	normalizedCT := strings.ToLower(strings.TrimSpace(req.ContentType))
	if !allowedContentTypes[normalizedCT] {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR",
			"Unsupported file type. Allowed: PDF, PNG, JPEG, WebP, GIF")
		return
	}

	// Validate file size (if provided)
	if req.FileSize > 0 && req.FileSize > maxFileSizeMB*1024*1024 {
		writeError(w, r, http.StatusBadRequest, "VALIDATION_ERROR",
			"File size exceeds the maximum allowed size of 10MB")
		return
	}

	// Sanitize filename — remove path separators
	sanitized := strings.ReplaceAll(req.Filename, "/", "_")
	sanitized = strings.ReplaceAll(sanitized, "\\", "_")
	sanitized = strings.ReplaceAll(sanitized, "..", "_")
	req.Filename = sanitized

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	resp, err := h.fileService.GeneratePresignedUploadURL(r.Context(), userID, req.Filename, normalizedCT)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate upload URL")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

