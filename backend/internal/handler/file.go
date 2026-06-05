package handler

import (
	"net/http"

	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/model"
	"github.com/sadaqah/backend/internal/service"
)

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

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	resp, err := h.fileService.GeneratePresignedUploadURL(r.Context(), userID, req.Filename, req.ContentType)
	if err != nil {
		writeError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate upload URL")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}
