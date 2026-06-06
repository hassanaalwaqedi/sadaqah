package model

import "time"

// PresignedURLResponse is the response for a pre-signed URL request.
type PresignedURLResponse struct {
	URL        string    `json:"url"`
	ObjectName string    `json:"object_name"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// PresignedURLRequest is the request payload for getting a pre-signed URL.
type PresignedURLRequest struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	FileSize    int64  `json:"file_size,omitempty"`
}
