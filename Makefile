# ============================================================
# Sadaqah Platform — Top-Level Makefile
# ============================================================

.PHONY: help dev up down build logs restart clean migrate-up migrate-down lint test

# Default target
help: ## Show this help message
	@echo "Sadaqah Platform — Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker ─────────────────────────────────────────────────

dev: ## Start full dev stack (with MailHog & pgAdmin)
	docker compose --profile dev up --build -d

up: ## Start core services
	docker compose up --build -d

down: ## Stop all services
	docker compose --profile dev down

build: ## Rebuild all containers
	docker compose build --no-cache

logs: ## Tail logs for all services
	docker compose logs -f

logs-api: ## Tail Go API logs
	docker compose logs -f go-api

logs-frontend: ## Tail Next.js logs
	docker compose logs -f nextjs

logs-ai: ## Tail AI worker logs
	docker compose logs -f ai-worker

restart: ## Restart all services
	docker compose restart

clean: ## Stop and remove all containers, volumes, and images
	docker compose --profile dev down -v --rmi local

# ── Database ───────────────────────────────────────────────

migrate-up: ## Run database migrations (up)
	docker compose exec go-api sh -c 'migrate -path migrations -database "$$DATABASE_URL" up'

migrate-down: ## Rollback last database migration
	docker compose exec go-api sh -c 'migrate -path migrations -database "$$DATABASE_URL" down 1'

migrate-create: ## Create a new migration (usage: make migrate-create name=create_users)
	@read -p "Migration name: " name; \
	cd backend && go run cmd/migrate/main.go -create $$name

db-shell: ## Open PostgreSQL shell
	docker compose exec postgres psql -U sadaqah -d sadaqah

redis-shell: ## Open Redis CLI
	docker compose exec redis redis-cli

# ── Development ────────────────────────────────────────────

lint: ## Run linters for all services
	cd backend && golangci-lint run ./...
	cd frontend && pnpm lint
	cd ai-worker && ruff check .

test: ## Run tests for all services
	cd backend && go test -v ./...
	cd frontend && pnpm test
	cd ai-worker && pytest

test-backend: ## Run Go backend tests
	cd backend && go test -v ./...

test-frontend: ## Run frontend tests
	cd frontend && pnpm test

test-ai: ## Run AI worker tests
	cd ai-worker && pytest

# ── Production ─────────────────────────────────────────────

prod-up: ## Start production stack
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production stack
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-build: ## Build production images
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build
