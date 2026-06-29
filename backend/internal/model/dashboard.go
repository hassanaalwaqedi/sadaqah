package model

import "time"

// DashboardData is the consolidated response for the /portal dashboard
type DashboardData struct {
	Summary    DashboardSummary  `json:"summary"`
	MyWork     DashboardMyWork   `json:"my_work"`
	Alerts     []DashboardAlert  `json:"alerts"`
	Activities []DashboardAction `json:"activities"`
	Health     *DashboardHealth  `json:"health,omitempty"` // Only for super admin
}

type DashboardSummary struct {
	Scholarships *ScholarshipsSummary `json:"scholarships,omitempty"`
	Innovation   *InnovationSummary   `json:"innovation,omitempty"`
	Finance      *FinanceSummary      `json:"finance,omitempty"`
}

type ScholarshipsSummary struct {
	Pending     int `json:"pending"`
	UnderReview int `json:"under_review"`
	Approved    int `json:"approved"`
	Rejected    int `json:"rejected"`
	Total       int `json:"total"`
}

type InnovationSummary struct {
	OpenEvents         int `json:"open_events"`
	PendingEvaluations int `json:"pending_evaluations"`
	TotalApplications  int `json:"total_applications"`
}

type FinanceSummary struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	NetBalance   float64 `json:"net_balance"`
}

type DashboardMyWork struct {
	AssignedCases []AssignedCase `json:"assigned_cases"`
	PendingTasks  []PendingTask  `json:"pending_tasks"`
}

type AssignedCase struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Type      string    `json:"type"` // e.g., "scholarship", "housing"
	Priority  string    `json:"priority"`
	Status    string    `json:"status"`
	Applicant string    `json:"applicant"`
	CreatedAt time.Time `json:"created_at"`
}

type PendingTask struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Type        string    `json:"type"` // e.g., "evaluation", "approval"
	DueDate     time.Time `json:"due_date"`
}

type DashboardAlert struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`  // "warning", "danger", "info"
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	ActionURL string    `json:"action_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type DashboardAction struct {
	ID          string    `json:"id"`
	Module      string    `json:"module"` // "scholarship", "innovation", "system"
	Action      string    `json:"action"` // e.g., "status_change", "document_upload"
	Description string    `json:"description"`
	Actor       string    `json:"actor"`
	CreatedAt   time.Time `json:"created_at"`
}

type DashboardHealth struct {
	DatabaseStatus string `json:"database_status"`
	RedisStatus    string `json:"redis_status"`
	UptimeSeconds  int64  `json:"uptime_seconds"`
}
