package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all application configuration.
type Config struct {
	App      AppConfig
	API      APIConfig
	DB       DBConfig
	Redis    RedisConfig
	JWT      JWTConfig
	MinIO    MinIOConfig
	SMTP     SMTPConfig
	AI       AIConfig
}

type AppConfig struct {
	Env  string // development, staging, production
	Name string
}

type APIConfig struct {
	Host           string
	Port           int
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	IdleTimeout    time.Duration
	AllowedOrigins []string
}

type DBConfig struct {
	URL      string
	MaxConns int32
	MinConns int32
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type JWTConfig struct {
	AccessSecret  string
	RefreshSecret string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

type MinIOConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

type SMTPConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
}

type AIConfig struct {
	WorkerHost     string
	WorkerPort     int
	InternalAPIKey string
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "development"),
			Name: getEnv("APP_NAME", "sadaqah"),
		},
		API: APIConfig{
			Host:           getEnv("API_HOST", "0.0.0.0"),
			Port:           getEnvInt("API_PORT", 8080),
			ReadTimeout:    getEnvDuration("API_READ_TIMEOUT", 15*time.Second),
			WriteTimeout:   getEnvDuration("API_WRITE_TIMEOUT", 15*time.Second),
			IdleTimeout:    getEnvDuration("API_IDLE_TIMEOUT", 60*time.Second),
			AllowedOrigins: getEnvStringSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost", "https://sadaqah-3caee.web.app"}),
		},
		DB: DBConfig{
			URL:      getEnv("DATABASE_URL", "postgres://sadaqah:sadaqah_dev_password@localhost:5432/sadaqah?sslmode=disable"),
			MaxConns: int32(getEnvInt("DB_MAX_CONNS", 25)),
			MinConns: int32(getEnvInt("DB_MIN_CONNS", 5)),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			AccessSecret:  getEnv("JWT_ACCESS_SECRET", ""),
			RefreshSecret: getEnv("JWT_REFRESH_SECRET", ""),
			AccessExpiry:  getEnvDuration("JWT_ACCESS_EXPIRY", 15*time.Minute),
			RefreshExpiry: getEnvDuration("JWT_REFRESH_EXPIRY", 168*time.Hour),
		},
		MinIO: MinIOConfig{
			Endpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
			AccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
			SecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
			Bucket:    getEnv("MINIO_BUCKET", "sadaqah-files"),
			UseSSL:    getEnvBool("MINIO_USE_SSL", false),
		},
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST", "localhost"),
			Port:     getEnvInt("SMTP_PORT", 1025),
			User:     getEnv("SMTP_USER", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "noreply@sadaqah.org"),
		},
		AI: AIConfig{
			WorkerHost:     getEnv("AI_WORKER_HOST", "localhost"),
			WorkerPort:     getEnvInt("AI_WORKER_PORT", 8000),
			InternalAPIKey: getEnv("AI_INTERNAL_API_KEY", ""),
		},
	}

	// Validate required fields
	if cfg.JWT.AccessSecret == "" {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET is required")
	}
	if cfg.JWT.RefreshSecret == "" {
		return nil, fmt.Errorf("JWT_REFRESH_SECRET is required")
	}

	return cfg, nil
}

// Addr returns the API listen address.
func (c *APIConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// RedisAddr returns the Redis connection address.
func (c *RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// IsDevelopment returns true if the app is running in development mode.
func (c *AppConfig) IsDevelopment() bool {
	return c.Env == "development"
}

// IsProduction returns true if the app is running in production mode.
func (c *AppConfig) IsProduction() bool {
	return c.Env == "production"
}

// ── Helper functions ──

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvStringSlice(key string, fallback []string) []string {
	if value, exists := os.LookupEnv(key); exists {
		// Split by comma
		var result []string
		for _, part := range strings.Split(value, ",") {
			trimmed := strings.TrimSpace(part)
			if trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if val, ok := os.LookupEnv(key); ok {
		if b, err := strconv.ParseBool(val); err == nil {
			return b
		}
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if val, ok := os.LookupEnv(key); ok {
		if d, err := time.ParseDuration(val); err == nil {
			return d
		}
	}
	return fallback
}
