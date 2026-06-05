package router

import (
	"log/slog"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/sadaqah/backend/internal/config"
	"github.com/sadaqah/backend/internal/handler"
	"github.com/sadaqah/backend/internal/middleware"
	"github.com/sadaqah/backend/internal/repository"
	"github.com/sadaqah/backend/internal/service"
)

// New creates and configures the Chi router with all routes.
func New(cfg *config.Config, pool *pgxpool.Pool, rdb *redis.Client, logger *slog.Logger) *chi.Mux {
	r := chi.NewRouter()

	// ── Global Middleware ──
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer(logger))
	r.Use(middleware.Logger(logger))
	r.Use(chimw.RealIP)
	r.Use(chimw.Compress(5))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// ── Dependencies ──
	userRepo := repository.NewUserRepository(pool)
	authService := service.NewAuthService(userRepo, rdb, cfg.JWT, logger)
	userService := service.NewUserService(userRepo, logger)
	fileService, err := service.NewFileService(cfg.MinIO)
	if err != nil {
		logger.Error("failed to initialize file service", slog.String("error", err.Error()))
		// Depending on strictness, we might panic or continue
	}

	authHandler := handler.NewAuthHandler(authService)
	healthHandler := handler.NewHealthHandler(pool, rdb)
	userHandler := handler.NewUserHandler(userService)
	fileHandler := handler.NewFileHandler(fileService)

	scholarshipRepo := repository.NewScholarshipRepository(pool)
	scholarshipService := service.NewScholarshipService(scholarshipRepo, logger)
	scholarshipHandler := handler.NewScholarshipHandler(scholarshipService)
	internalHandler := handler.NewInternalHandler(scholarshipService)

	evaluationRepo := repository.NewEvaluationRepository(pool)
	evaluationService := service.NewEvaluationService(evaluationRepo, logger)
	evaluationHandler := handler.NewEvaluationHandler(evaluationService)

	housingRepo := repository.NewHousingRepository(pool)
	housingService := service.NewHousingService(housingRepo, logger)
	housingHandler := handler.NewHousingHandler(housingService)

	innovationRepo := repository.NewInnovationRepository(pool)
	innovationService := service.NewInnovationService(innovationRepo, logger)
	innovationHandler := handler.NewInnovationHandler(innovationService)

	coreOpsRepo := repository.NewCoreOpsRepository(pool)
	coreOpsService := service.NewCoreOpsService(coreOpsRepo, logger)
	coreOpsHandler := handler.NewCoreOpsHandler(coreOpsService)

	// Start Background Cron Jobs
	housingService.StartRentInvoiceCron()

	// ── Routes ──
	r.Route("/api/v1", func(api chi.Router) {
		// Health
		api.Get("/health", healthHandler.Health)

		// Internal Webhooks (from AI Worker)
		api.Route("/internal", func(internal chi.Router) {
			internal.Use(middleware.InternalAPIKey(cfg.AI))
			internal.Post("/ocr/results", internalHandler.HandleOCRResult)
			internal.Post("/ranking/results", internalHandler.HandleRankingResult)
		})

		// Auth (public — rate limited)
		api.Route("/auth", func(auth chi.Router) {
			auth.Use(httprate.LimitByIP(10, 1*time.Minute))

			auth.Post("/register", authHandler.Register)
			auth.Post("/login", authHandler.Login)
			auth.Post("/refresh", authHandler.Refresh)
			auth.Post("/forgot-password", authHandler.ForgotPassword)
			auth.Post("/reset-password", authHandler.ResetPassword)
			auth.Post("/verify-email", authHandler.VerifyEmail)
		})

		// Authenticated routes
		api.Group(func(authenticated chi.Router) {
			authenticated.Use(middleware.JWTAuth(cfg.JWT.AccessSecret, rdb, logger))

			// Auth (logout requires auth)
			authenticated.Post("/auth/logout", authHandler.Logout)

			// Users
			authenticated.Get("/users/me", authHandler.Me)

			// ── Scholarships ──
			authenticated.Route("/scholarships", func(sch chi.Router) {
				sch.Route("/cycles", func(cycles chi.Router) {
					// Admin
					cycles.With(middleware.RequireRoles("super_admin", "admin", "scholarship_admin")).Post("/", scholarshipHandler.CreateCycle)
					
					// Students & Admins
					cycles.Get("/", scholarshipHandler.ListCycles)
					
					// Applications
					cycles.Post("/{id}/apply", scholarshipHandler.SubmitApplication)
				})
			})

			// ── Housing ──
			authenticated.Route("/housing", func(hsg chi.Router) {
				hsg.Get("/buildings", housingHandler.GetBuildings)
				hsg.Get("/buildings/{buildingId}/rooms", housingHandler.GetRooms)
				
				// Admin endpoints
				hsg.With(middleware.RequireRoles("super_admin", "admin")).Post("/allocate", housingHandler.AllocateRoom)

				// Resident endpoints
				hsg.Get("/invoices/me", housingHandler.GetMyInvoices)
			})

			// ── Innovation ──
			authenticated.Route("/innovation", func(inn chi.Router) {
				inn.Route("/events", func(e chi.Router) {
					e.Get("/", innovationHandler.GetEvents)
					e.With(middleware.RequireRoles("super_admin", "admin")).Post("/", innovationHandler.CreateEvent)
					e.Post("/{eventId}/submit", innovationHandler.SubmitProject)
				})
				inn.Route("/judging", func(j chi.Router) {
					j.With(middleware.RequireRoles("judge", "super_admin")).Get("/", innovationHandler.GetJudgingAssignments)
					j.With(middleware.RequireRoles("judge", "super_admin")).Post("/{assignmentId}", innovationHandler.SubmitScores)
				})
			})

			// ── Campaigns & Donations ──
			authenticated.Route("/campaigns", func(c chi.Router) {
				c.Get("/", coreOpsHandler.GetCampaigns)
				c.Post("/donate", coreOpsHandler.ProcessDonation)
			})

			// ── Financial ──
			authenticated.Route("/finance", func(f chi.Router) {
				f.With(middleware.RequireRoles("super_admin", "admin", "auditor")).Get("/budgets", coreOpsHandler.GetBudgets)
			})

			// ── Research ──
			authenticated.Route("/research", func(r chi.Router) {
				r.With(middleware.RequireRoles("super_admin", "admin", "researcher")).Post("/grants", coreOpsHandler.SubmitGrant)
			})

			// ── Inventory ──
			authenticated.Route("/inventory", func(inv chi.Router) {
				inv.With(middleware.RequireRoles("super_admin", "admin")).Get("/assets", coreOpsHandler.GetAssets)
			})



			// ── Notifications ──
			authenticated.Route("/notifications", func(notif chi.Router) {
				notif.Get("/", notImplemented)
				notif.Put("/{id}/read", notImplemented)
				notif.Put("/read-all", notImplemented)
			})

			// ── Reports ──
			authenticated.Route("/reports", func(rpt chi.Router) {
				rpt.Get("/scholarships", notImplemented)
				rpt.Get("/housing", notImplemented)
				rpt.Get("/donations", notImplemented)
				rpt.Get("/finance", notImplemented)
			})

			// ── Evaluations (Judges) ──
			authenticated.Route("/evaluations", func(evals chi.Router) {
				evals.Use(middleware.RequireRoles("judge", "super_admin"))
				evals.Get("/me", evaluationHandler.GetMyEvaluations)
				evals.Post("/{id}/score", evaluationHandler.SubmitScores)
			})

			// ── Files ──
			authenticated.Post("/files/presigned-url", fileHandler.GetPresignedURL)
			authenticated.Get("/files/{id}", notImplemented)
			authenticated.Delete("/files/{id}", notImplemented)

			// ── Admin ──
			authenticated.Route("/admin", func(adm chi.Router) {
				adm.Use(middleware.RequireRoles("super_admin", "admin"))
				
				adm.Route("/users", func(users chi.Router) {
					users.Get("/", userHandler.List)
					users.Get("/{id}", userHandler.Get)
					users.Post("/{id}/roles", userHandler.AssignRole)
					users.Delete("/{id}", userHandler.Deactivate)
				})

				adm.Get("/audit-logs", notImplemented)
				adm.Get("/system-health", healthHandler.Health)
				adm.Get("/stats", notImplemented)
			})
		})
	})

	return r
}

// notImplemented returns a 501 Not Implemented response.
func notImplemented(w http.ResponseWriter, r *http.Request) {
	handler.NotImplemented(w, r)
}
