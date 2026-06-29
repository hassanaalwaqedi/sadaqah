-- Migration 019: Enterprise Budget Management

-- 1. Extend existing 'budgets' table
ALTER TABLE budgets
    ADD COLUMN description TEXT,
    ADD COLUMN department_id VARCHAR(100),
    ADD COLUMN program_id VARCHAR(100),
    ADD COLUMN start_date DATE,
    ADD COLUMN end_date DATE,
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'Custom Budget',
    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft',
    ADD COLUMN reserved_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN notes TEXT,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create Indexes
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_year ON budgets(fiscal_year);

-- 2. Extend existing 'budget_allocations' table
ALTER TABLE budget_allocations
    ADD COLUMN category VARCHAR(100),
    ADD COLUMN notes TEXT,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Create 'budget_funding_sources' table
CREATE TABLE budget_funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    donor_name VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create 'budget_limits' table
CREATE TABLE budget_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL,
    max_amount NUMERIC(15, 2) NOT NULL,
    alert_threshold NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Update financial_transactions to link to budget_allocations
-- (budget_id already exists in financial_transactions)
ALTER TABLE financial_transactions
    ADD COLUMN budget_allocation_id UUID REFERENCES budget_allocations(id) ON DELETE SET NULL;

CREATE INDEX idx_financial_trans_alloc ON financial_transactions(budget_allocation_id);
