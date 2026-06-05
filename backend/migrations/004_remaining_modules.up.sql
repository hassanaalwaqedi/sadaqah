-- ============================================================
-- Migration 004: Innovation, Donors, Finance, Research, Inventory
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- INNOVATION & CONFERENCE
-- ══════════════════════════════════════════════════════════════

CREATE TABLE innovation_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en             VARCHAR(200) NOT NULL,
    name_ar             VARCHAR(200) NOT NULL,
    description         TEXT,
    event_date          DATE,
    submission_deadline TIMESTAMPTZ NOT NULL,
    status              VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'open', 'judging', 'completed')),
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE TABLE event_categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      UUID NOT NULL REFERENCES innovation_events(id) ON DELETE CASCADE,
    name_en       VARCHAR(200) NOT NULL,
    name_ar       VARCHAR(200) NOT NULL,
    description   TEXT,
    max_team_size SMALLINT DEFAULT 5,
    sort_order    SMALLINT NOT NULL
);

CREATE TABLE project_submissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID NOT NULL REFERENCES event_categories(id) ON DELETE RESTRICT,
    submitter_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title         VARCHAR(300) NOT NULL,
    abstract      TEXT NOT NULL,
    description   TEXT,
    status        VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'under_judging', 'scored', 'winner')),
    final_score   DECIMAL(8,4),
    final_rank    INTEGER,
    submitted_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_proj_category_status ON project_submissions(category_id, status);

CREATE TABLE project_team_members (
    project_id UUID NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(50) DEFAULT 'member',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE judging_assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
    judge_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status      VARCHAR(20) NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, judge_id)
);

CREATE TABLE judging_scores (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id  UUID NOT NULL REFERENCES judging_assignments(id) ON DELETE CASCADE,
    criteria_name  VARCHAR(200) NOT NULL,
    score          DECIMAL(5,2) NOT NULL,
    max_score      DECIMAL(5,2) NOT NULL,
    notes          TEXT
);

-- ══════════════════════════════════════════════════════════════
-- DONOR & CAMPAIGNS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE campaigns (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en           VARCHAR(300) NOT NULL,
    title_ar           VARCHAR(300) NOT NULL,
    description        TEXT,
    goal_amount        DECIMAL(14,2) NOT NULL,
    raised_amount      DECIMAL(14,2) DEFAULT 0,
    currency           VARCHAR(3) DEFAULT 'USD',
    start_date         DATE NOT NULL,
    end_date           DATE,
    status             VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    cover_image_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE deleted_at IS NULL;

CREATE TABLE donor_profiles (
    user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    organization_name  VARCHAR(300),
    country            VARCHAR(100),
    total_donated      DECIMAL(14,2) DEFAULT 0,
    first_donation_at  TIMESTAMPTZ,
    donor_tier         VARCHAR(20) CHECK (donor_tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

CREATE TABLE recurring_donation_schedules (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    amount        DECIMAL(14,2) NOT NULL,
    currency      VARCHAR(3) DEFAULT 'USD',
    frequency     VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annually')),
    next_run_at   TIMESTAMPTZ NOT NULL,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE donations (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id            UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    donor_id               UUID REFERENCES users(id) ON DELETE SET NULL,
    amount                 DECIMAL(14,2) NOT NULL,
    currency               VARCHAR(3) DEFAULT 'USD',
    payment_method         VARCHAR(30) NOT NULL,
    payment_ref            VARCHAR(200),
    is_anonymous           BOOLEAN DEFAULT false,
    is_recurring           BOOLEAN DEFAULT false,
    recurring_schedule_id  UUID REFERENCES recurring_donation_schedules(id) ON DELETE SET NULL,
    status                 VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    donated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);

CREATE TABLE donation_receipts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    file_id     UUID REFERENCES files(id) ON DELETE SET NULL,
    receipt_no  VARCHAR(50) UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE impact_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title       VARCHAR(300) NOT NULL,
    content     TEXT NOT NULL,
    published   BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- FINANCIAL
-- ══════════════════════════════════════════════════════════════

CREATE TABLE budgets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en      VARCHAR(200) NOT NULL,
    name_ar      VARCHAR(200) NOT NULL,
    fiscal_year  VARCHAR(9) NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    spent_amount DECIMAL(14,2) DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_allocations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id        UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    program          VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(14,2) NOT NULL,
    spent_amount     DECIMAL(14,2) DEFAULT 0
);

CREATE TABLE financial_transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type             VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category         VARCHAR(100) NOT NULL,
    amount           DECIMAL(14,2) NOT NULL,
    currency         VARCHAR(3) DEFAULT 'USD',
    description      TEXT,
    reference_type   VARCHAR(50),
    reference_id     UUID,
    budget_id        UUID REFERENCES budgets(id) ON DELETE SET NULL,
    recorded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fin_tx_date ON financial_transactions(transaction_date);
CREATE INDEX idx_fin_tx_budget ON financial_transactions(budget_id);
CREATE INDEX idx_fin_tx_type ON financial_transactions(type);

CREATE TABLE expense_requests (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    budget_allocation_id UUID REFERENCES budget_allocations(id) ON DELETE SET NULL,
    amount               DECIMAL(14,2) NOT NULL,
    description          TEXT NOT NULL,
    status               VARCHAR(20) NOT NULL CHECK (status IN ('submitted', 'manager_approved', 'finance_approved', 'disbursed', 'rejected')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expense_approvals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id        UUID NOT NULL REFERENCES expense_requests(id) ON DELETE CASCADE,
    approver_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approval_level    VARCHAR(20) NOT NULL CHECK (approval_level IN ('manager', 'finance')),
    decision          VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    comments          TEXT,
    decided_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- RESEARCH
-- ══════════════════════════════════════════════════════════════

CREATE TABLE research_grants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title            VARCHAR(300) NOT NULL,
    abstract         TEXT NOT NULL,
    requested_budget DECIMAL(14,2) NOT NULL,
    approved_budget  DECIMAL(14,2),
    status           VARCHAR(20) NOT NULL CHECK (status IN ('proposed', 'under_review', 'approved', 'active', 'completed', 'cancelled')),
    start_date       DATE,
    end_date         DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE TABLE grant_milestones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id    UUID NOT NULL REFERENCES research_grants(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    due_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    completed_at TIMESTAMPTZ
);

CREATE TABLE grant_publications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id     UUID NOT NULL REFERENCES research_grants(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    journal      VARCHAR(300),
    doi          VARCHAR(100),
    published_at DATE,
    file_id      UUID REFERENCES files(id) ON DELETE SET NULL
);

-- ══════════════════════════════════════════════════════════════
-- INVENTORY
-- ══════════════════════════════════════════════════════════════

CREATE TABLE asset_categories (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en   VARCHAR(200) NOT NULL,
    name_ar   VARCHAR(200) NOT NULL,
    parent_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL
);

CREATE TABLE assets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id    UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    asset_tag      VARCHAR(50) UNIQUE NOT NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    purchase_date  DATE,
    purchase_cost  DECIMAL(12,2),
    current_value  DECIMAL(12,2),
    condition      VARCHAR(20) CHECK (condition IN ('new', 'good', 'fair', 'poor', 'decommissioned')),
    location       VARCHAR(200),
    room_id        UUID REFERENCES rooms(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

CREATE TABLE asset_assignments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id              UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    assigned_to_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_department VARCHAR(100),
    assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    returned_at           TIMESTAMPTZ
);

CREATE TABLE asset_maintenance_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id         UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL,
    description      TEXT,
    cost             DECIMAL(10,2),
    performed_at     DATE NOT NULL,
    next_maintenance DATE
);
