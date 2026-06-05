package service

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/sadaqah/backend/internal/config"
	"github.com/sadaqah/backend/internal/model"
)

// FileService handles file uploads to MinIO (S3-compatible).
type FileService struct {
	client *minio.Client
	cfg    config.MinIOConfig
}

// NewFileService initializes the MinIO client.
func NewFileService(cfg config.MinIOConfig) (*FileService, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("initializing minio client: %w", err)
	}

	// Ensure bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, fmt.Errorf("checking bucket: %w", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("creating bucket: %w", err)
		}
	}

	return &FileService{
		client: client,
		cfg:    cfg,
	}, nil
}

// GeneratePresignedUploadURL generates a temporary URL for direct frontend uploads to MinIO.
func (s *FileService) GeneratePresignedUploadURL(ctx context.Context, userID uuid.UUID, filename, contentType string) (*model.PresignedURLResponse, error) {
	// Generate a unique object name: users/{user_id}/{uuid}_{filename}
	objectName := fmt.Sprintf("users/%s/%s_%s", userID.String(), uuid.New().String(), filename)

	// Set expiration to 15 minutes
	expiry := 15 * time.Minute

	// Generate URL
	reqParams := make(url.Values)
	reqParams.Set("response-content-type", contentType)

	presignedURL, err := s.client.PresignedPutObject(ctx, s.cfg.Bucket, objectName, expiry)
	if err != nil {
		return nil, fmt.Errorf("generating presigned URL: %w", err)
	}

	// Calculate expiration timestamp
	expiresAt := time.Now().Add(expiry)

	return &model.PresignedURLResponse{
		URL:        presignedURL.String(),
		ObjectName: objectName,
		ExpiresAt:  expiresAt,
	}, nil
}
