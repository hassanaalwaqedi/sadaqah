package router

import (
	"fmt"
	"log/slog"
	"net/http"
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
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.GlobalRateLimit())
	r.Use(chimw.RealIP)
	r.Use(chimw.Compress(5))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.API.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// ── Dependencies ──
	auditRepo := repository.NewAuditRepository(pool)
	auditService := service.NewAuditService(auditRepo, logger)
	auditHandler := handler.NewAuditHandler(auditService)

	emailService := service.NewEmailService(service.EmailConfig{
		Host:     cfg.SMTP.Host,
		Port:     fmt.Sprintf("%d", cfg.SMTP.Port),
		Username: cfg.SMTP.User,
		Password: cfg.SMTP.Password,
		From:     cfg.SMTP.From,
	}, logger)

	userRepo := repository.NewUserRepository(pool)
	authService := service.NewAuthService(userRepo, rdb, cfg.JWT, emailService, logger)
	userService := service.NewUserService(userRepo, auditService, emailService, logger)
	userService.SetAuditRepo(auditRepo)

	fileService, err := service.NewFileService(cfg.MinIO)
	if err != nil {
		logger.Error("failed to initialize file service", slog.String("error", err.Error()))
	}

	// RBAC
	rbacRepo := repository.NewRBACRepository(pool)
	rbacService := service.NewRBACService(rbacRepo, userRepo, auditService, rdb, logger)
	rbacHandler := handler.NewRBACHandler(rbacService)

	// Cross-wire to avoid circular deps
	userService.SetRBACService(rbacService)

	// Permission resolver for middleware
	permResolve := middleware.PermissionResolver(rbacService)

	authHandler := handler.NewAuthHandler(authService)
	healthHandler := handler.NewHealthHandler(pool, rdb)
	userHandler := handler.NewUserHandler(userService)
	fileHandler := handler.NewFileHandler(fileService)

	scholarshipRepo := repository.NewScholarshipRepository(pool)
	scholarshipService := service.NewScholarshipService(scholarshipRepo, fileService, logger)
	scholarshipHandler := handler.NewScholarshipHandler(scholarshipService)
	
	aiJobRepo := repository.NewAIJobRepository(pool)
	aiJobService := service.NewAIJobService(aiJobRepo, rdb, logger)
	internalHandler := handler.NewInternalHandler(scholarshipService, aiJobService)

	onboardingHandler := handler.NewOnboardingHandler(userRepo)
	profileHandler := handler.NewProfileHandler(userRepo)

	evaluationRepo := repository.NewEvaluationRepository(pool)
	evaluationService := service.NewEvaluationService(evaluationRepo, logger)
	evaluationHandler := handler.NewEvaluationHandler(evaluationService)

	innovationRepo := repository.NewInnovationRepository(pool)
	innovationService := service.NewInnovationService(innovationRepo, logger)
	innovationHandler := handler.NewInnovationHandler(innovationService)

	coreOpsRepo := repository.NewCoreOpsRepository(pool)
	coreOpsService := service.NewCoreOpsService(coreOpsRepo, auditService, emailService, logger)
	coreOpsHandler := handler.NewCoreOpsHandler(coreOpsService)
	publicHandler := handler.NewPublicHandler(coreOpsService, rdb)

	notificationRepo := repository.NewNotificationRepository(pool)
	notificationService := service.NewNotificationService(notificationRepo, nil, nil, nil, logger)
	notificationHandler := handler.NewNotificationHandler(notificationService, nil)

	reportRepo := repository.NewReportRepository(pool)
	reportService := service.NewReportService(reportRepo, logger)
	reportHandler := handler.NewReportHandler(reportService)

	dashboardRepo := repository.NewDashboardRepository(pool)
	dashboardService := service.NewDashboardService(dashboardRepo, reportRepo, logger)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)

	assetRepo := repository.NewAssetRepository(pool)
	assetService := service.NewAssetService(assetRepo, logger)
	assetHandler := handler.NewAssetHandler(assetService)

	// ── Routes ──
	r.Route("/api/v1", func(api chi.Router) {
		// Health
		api.Get("/health", healthHandler.Health)

		// Internal Webhooks (from AI Worker)
		api.Route("/internal", func(internal chi.Router) {
			internal.Use(middleware.InternalAPIKey(cfg.AI))
			internal.Route("/ocr", func(r chi.Router) {
				r.Post("/results", internalHandler.HandleOCRResult)
			})
			internal.Route("/ranking", func(r chi.Router) {
				r.Post("/results", internalHandler.HandleRankingResult)
			})
			internal.Route("/jobs", func(r chi.Router) {
				r.Put("/{id}/status", internalHandler.UpdateJobStatus)
				r.Post("/{id}/fail", internalHandler.FailJob)
			})
		})

		// Public Endpoints (Cached & Rate Limited)
		api.Route("/public", func(public chi.Router) {
			public.Use(middleware.PublicRateLimit(rdb, 60, 1*time.Minute))
			public.Get("/metrics", publicHandler.GetMetrics)
			public.Get("/campaigns/{id}", publicHandler.GetCampaignByID)
			// public.Post("/campaigns/donate", coreOpsHandler.ProcessDonation)
		})

		// Auth (public — rate limited)
		api.Route("/auth", func(auth chi.Router) {
			// Login/register: stricter limit to prevent brute force
			auth.Group(func(strict chi.Router) {
				strict.Use(httprate.LimitByIP(10, 1*time.Minute))
				strict.Post("/register", authHandler.Register)
				strict.Post("/login", authHandler.Login)
				strict.Post("/google", authHandler.GoogleLogin)
				strict.Post("/forgot-password", authHandler.ForgotPassword)
				strict.Post("/reset-password", authHandler.ResetPassword)
				strict.Post("/verify-email", authHandler.VerifyEmail)
			})

			// Refresh: more generous limit (called automatically by frontend)
			auth.Group(func(refresh chi.Router) {
				refresh.Use(httprate.LimitByIP(30, 1*time.Minute))
				refresh.Post("/refresh", authHandler.Refresh)
			})
		})

		// Authenticated routes
		api.Group(func(authenticated chi.Router) {
			authenticated.Use(middleware.JWTAuth(cfg.JWT.AccessSecret, rdb, logger))

			// Auth (logout requires auth)
			authenticated.Post("/auth/logout", authHandler.Logout)

			// Users
			authenticated.Get("/users/me", authHandler.Me)

			// Onboarding Wizard (allowed when profile is incomplete)
			authenticated.Post("/onboarding/identity", onboardingHandler.Phase1Identity)
			authenticated.Post("/onboarding/interests", onboardingHandler.Phase2Interests)

			// Profile Management
			authenticated.Get("/profile", profileHandler.GetUniversalProfile)
			authenticated.Put("/profile", profileHandler.UpdateUniversalProfile)
			authenticated.Get("/profile/vault", profileHandler.GetVault)
			authenticated.Post("/profile/vault", profileHandler.AddToVault)

			// Strict block: endpoints requiring completed profile
			authenticated.Group(func(strict chi.Router) {
				strict.Use(middleware.RequireProfileCompleted())

				// ── Dashboard ──
				strict.Get("/dashboard", dashboardHandler.GetDashboardData)

				// ── Scholarships ── (permission-based)
				strict.Route("/scholarships", func(sch chi.Router) {
					sch.Route("/cycles", func(cycles chi.Router) {
						// Admin: requires scholarships.create permission
						cycles.With(middleware.RequirePermission(permResolve, "scholarships.create", "scholarships.manage")).Post("/", scholarshipHandler.CreateCycle)
						
						// Students & Admins
						cycles.Get("/", scholarshipHandler.ListCycles)
						
						// Specific Cycle & Applications
						cycles.Get("/{id}", scholarshipHandler.GetCycle)
						cycles.Get("/{id}/applications", scholarshipHandler.GetApplicationsByCycle)

						// Applications Submit
						cycles.Post("/{id}/apply", scholarshipHandler.SubmitApplication)
					})
					
					sch.Route("/applications", func(apps chi.Router) {
						apps.Get("/my", scholarshipHandler.GetMyApplications)
						apps.Get("/assigned-to-me", scholarshipHandler.GetMyAssignedApplications)
						
						apps.Get("/{appId}", scholarshipHandler.GetApplicationDetails)
						apps.Put("/{appId}/status", scholarshipHandler.UpdateApplicationStatus)
						apps.Put("/{appId}/assign", scholarshipHandler.AssignCaseWorker)
						apps.Put("/{appId}/priority", scholarshipHandler.UpdatePriority)
						apps.Post("/{appId}/messages", scholarshipHandler.AddScholarshipMessage)
						apps.Post("/{appId}/score", scholarshipHandler.SubmitApplicationScore)
						
						// Certificates
						apps.Get("/{id}/certificate", scholarshipHandler.GetCertificateData)
					})
				})

			// ── Innovation ── (permission-based)
			strict.Route("/innovation", func(inn chi.Router) {
				inn.Route("/events", func(e chi.Router) {
					e.Get("/", innovationHandler.GetEvents)
					e.With(middleware.RequirePermission(permResolve, "innovation.create", "innovation.manage")).Post("/", innovationHandler.CreateEvent)
					e.Post("/{eventId}/submit", innovationHandler.SubmitProject)
				})
				inn.Route("/judging", func(j chi.Router) {
					j.With(middleware.RequirePermission(permResolve, "innovation.review", "innovation.score")).Get("/", innovationHandler.GetJudgingAssignments)
					j.With(middleware.RequirePermission(permResolve, "innovation.score")).Post("/{assignmentId}", innovationHandler.SubmitScores)
				})
			})

			// ── Campaigns & Donations ──
			strict.Route("/campaigns", func(c chi.Router) {
				// c.Get("/", coreOpsHandler.GetCampaigns)
			})

			// ── Financial ── (permission-based)
			strict.Route("/finance", func(f chi.Router) {
				f.With(middleware.RequirePermission(permResolve, "finance.read", "finance.manage")).Get("/budgets", coreOpsHandler.GetBudgets)
				f.Post("/expenses", coreOpsHandler.SubmitExpense)
				f.With(middleware.RequirePermission(permResolve, "finance.approve", "finance.manage")).Post("/expenses/disburse", coreOpsHandler.DisburseExpense)
			})

			// ── Research ── (permission-based)
			strict.Route("/research", func(r chi.Router) {
				r.With(middleware.RequirePermission(permResolve, "research.create")).Post("/grants", coreOpsHandler.SubmitGrant)
			})

			// ── Inventory ── (permission-based)
			strict.Route("/inventory", func(inv chi.Router) {
				
			})

			// ── Notifications ──
			strict.Route("/notifications", func(notif chi.Router) {
				notif.Get("/", notificationHandler.GetMyNotifications)
				notif.Put("/{id}/read", notificationHandler.MarkAsRead)
				notif.Put("/read-all", notificationHandler.MarkAllAsRead)
			})

			// ── Assets ──
			strict.Route("/assets", func(a chi.Router) {
				a.Get("/dashboard", assetHandler.GetDashboardStats)
				a.Get("/", assetHandler.GetAssets)
				a.Post("/", assetHandler.CreateAsset)
			})

			// ── Reports ── (permission-based)
			strict.Route("/reports", func(rpt chi.Router) {
				rpt.Use(middleware.RequirePermission(permResolve, "reports.read", "reports.generate"))
				rpt.Get("/scholarships", reportHandler.GetScholarshipsReport)
				// rpt.Get("/housing", reportHandler.GetHousingReport)
				rpt.Get("/donations", reportHandler.GetDonationsReport)
				rpt.Get("/finance", reportHandler.GetFinanceReport)
			})

			// ── Evaluations (Judges) ── (permission-based)
			strict.Route("/evaluations", func(evals chi.Router) {
				evals.Use(middleware.RequirePermission(permResolve, "scholarships.evaluate"))
				evals.Get("/me", evaluationHandler.GetMyEvaluations)
				evals.Post("/{id}/score", evaluationHandler.SubmitScores)
			})

			// ── Files ──
			strict.Post("/files/presigned-url", fileHandler.GetPresignedURL)
			strict.Get("/files/{id}", notImplemented)
			strict.Delete("/files/{id}", notImplemented)

			// ── Admin ── (permission-based)
			strict.Route("/admin", func(adm chi.Router) {
				// All admin routes require at least one admin-level permission
				adm.Use(middleware.RequireRoles("super_admin", "admin", "org_admin", "scholarship_manager", "innovation_manager", "financial_officer"))
				
				// 🛠️ User Management 🛠️
				adm.Route("/users", func(users chi.Router) {
					users.With(middleware.RequirePermission(permResolve, "users.read")).Get("/", userHandler.List)
					users.With(middleware.RequirePermission(permResolve, "users.read")).Get("/{id}", userHandler.Get)
					users.With(middleware.RequirePermission(permResolve, "users.read")).Get("/{id}/profile", profileHandler.GetAnyUserProfile)
					users.With(middleware.RequirePermission(permResolve, "users.read")).Get("/{id}/vault", profileHandler.GetAnyUserVault)
					users.With(middleware.RequirePermission(permResolve, "roles.assign")).Post("/{id}/roles", userHandler.AssignRole)
					users.With(middleware.RequirePermission(permResolve, "roles.assign")).Delete("/{id}/roles/{roleId}", userHandler.RemoveRole)
					users.With(middleware.RequirePermission(permResolve, "users.delete")).Delete("/{id}", userHandler.Deactivate)
					users.With(middleware.RequirePermission(permResolve, "users.update")).Post("/{id}/suspend", userHandler.SuspendUser)
					users.With(middleware.RequirePermission(permResolve, "users.update")).Post("/{id}/reactivate", userHandler.ReactivateUser)
					users.With(middleware.RequirePermission(permResolve, "users.read")).Get("/{id}/login-history", userHandler.GetLoginHistory)
					users.With(middleware.RequirePermission(permResolve, "users.read")).Get("/{id}/activity", userHandler.GetUserActivity)
					users.With(middleware.RequirePermission(permResolve, "users.update")).Post("/{id}/force-logout", userHandler.ForceLogout)
				})

				// ── RBAC Management ──
				adm.Route("/roles", func(roles chi.Router) {
					roles.With(middleware.RequirePermission(permResolve, "roles.read")).Get("/", rbacHandler.ListRoles)
					roles.With(middleware.RequirePermission(permResolve, "roles.read")).Get("/{id}", rbacHandler.GetRole)
					roles.With(middleware.RequirePermission(permResolve, "roles.create")).Post("/", rbacHandler.CreateRole)
					roles.With(middleware.RequirePermission(permResolve, "roles.update")).Put("/{id}", rbacHandler.UpdateRole)
					roles.With(middleware.RequirePermission(permResolve, "roles.create")).Post("/{id}/clone", rbacHandler.CloneRole)
					roles.With(middleware.RequirePermission(permResolve, "roles.delete")).Delete("/{id}", rbacHandler.DeactivateRole)
					roles.With(middleware.RequirePermission(permResolve, "roles.assign")).Put("/{id}/permissions", rbacHandler.AssignPermissions)
					roles.With(middleware.RequirePermission(permResolve, "roles.assign")).Delete("/{id}/permissions", rbacHandler.RemovePermissions)
				})

				adm.Route("/permissions", func(perms chi.Router) {
					perms.With(middleware.RequirePermission(permResolve, "roles.read")).Get("/", rbacHandler.ListPermissions)
					perms.With(middleware.RequirePermission(permResolve, "roles.read")).Get("/groups", rbacHandler.ListPermissionGroups)
				})

				// ── Audit Logs ──
				adm.With(middleware.RequirePermission(permResolve, "admin.audit")).Get("/audit-logs", auditHandler.GetLogs)

				// ── System ──
				adm.Get("/system-health", healthHandler.Health)
				adm.Get("/stats", notImplemented)
				adm.Get("/reports", coreOpsHandler.GetSystemReports)
			})
			}) // end strict group
		})
	})

	return r
}

// notImplemented returns a 501 Not Implemented response.
func notImplemented(w http.ResponseWriter, r *http.Request) {
	handler.NotImplemented(w, r)
}

