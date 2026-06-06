package service_test

import (
	"context"
	"log/slog"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

type TestDatabase struct {
	Pool      *pgxpool.Pool
	Container *postgres.PostgresContainer
	Logger    *slog.Logger
}

func SetupTestDB(t *testing.T, ctx context.Context) *TestDatabase {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

	// Setup Postgres container
	dbName := "sadaqah_test"
	dbUser := "user"
	dbPassword := "password"

	postgresContainer, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase(dbName),
		postgres.WithUsername(dbUser),
		postgres.WithPassword(dbPassword),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(5*time.Second)),
	)
	if err != nil {
		t.Fatalf("failed to start container: %s", err)
	}

	connStr, err := postgresContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("failed to get connection string: %s", err)
	}

	// Connect to database
	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		t.Fatalf("failed to connect to database: %s", err)
	}

	// Run migrations manually
	schemaSQL, err := os.ReadFile(filepath.Join("..", "..", "migrations", "001_core_tables.up.sql"))
	if err != nil {
		t.Fatalf("failed to read migrations: %s", err)
	}

	_, err = pool.Exec(ctx, string(schemaSQL))
	if err != nil {
		t.Fatalf("failed to execute migrations: %s", err)
	}

	// Mock Seed Data
	seedSQL := `
		INSERT INTO users (id, first_name, last_name, email, password_hash) 
		VALUES ('11111111-1111-1111-1111-111111111111', 'Test', 'User', 'test@test.com', 'hash');
		
		INSERT INTO campaigns (id, title_en, title_ar, type, target_amount, current_amount, start_date, end_date, status)
		VALUES ('22222222-2222-2222-2222-222222222222', 'Test Campaign', 'Test Campaign', 'zakat', 10000, 0, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'active');
	`
	_, err = pool.Exec(ctx, seedSQL)
	if err != nil {
		t.Fatalf("failed to execute seed data: %s", err)
	}

	return &TestDatabase{
		Pool:      pool,
		Container: postgresContainer,
		Logger:    logger,
	}
}

func (td *TestDatabase) Teardown(t *testing.T, ctx context.Context) {
	td.Pool.Close()
	if err := td.Container.Terminate(ctx); err != nil {
		t.Fatalf("failed to terminate container: %s", err)
	}
}
