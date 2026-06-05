package database

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/v9"

	"github.com/sadaqah/backend/internal/config"
)

// NewRedisClient creates a new Redis client.
func NewRedisClient(ctx context.Context, cfg config.RedisConfig, logger *slog.Logger) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr(),
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: 20,
	})

	// Verify connectivity
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("pinging redis: %w", err)
	}

	logger.Info("redis connected",
		slog.String("addr", cfg.Addr()),
		slog.Int("db", cfg.DB),
	)

	return rdb, nil
}
