-- Migration 020: Enterprise Donor Management

-- Alter campaigns table to add new constraints and categories
ALTER TABLE campaigns
    ADD COLUMN category VARCHAR(100) DEFAULT 'General Donation',
    ADD COLUMN visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
    ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Alter donations table to add fund restriction and allocation tracking
ALTER TABLE donations
    ADD COLUMN donation_type VARCHAR(100) DEFAULT 'Sadaqah',
    ADD COLUMN allocation_status VARCHAR(50) DEFAULT 'pending' CHECK (allocation_status IN ('pending', 'allocated', 'partially_allocated')),
    ADD COLUMN restricted_fund_id UUID REFERENCES budgets(id) ON DELETE SET NULL, -- Maps to a budget if strictly restricted
    ADD COLUMN notes TEXT;

-- Create impact metrics table for campaigns
CREATE TABLE campaign_impact_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    metric_name_en VARCHAR(200) NOT NULL,
    metric_name_ar VARCHAR(200) NOT NULL,
    target_value DECIMAL(14,2) NOT NULL,
    current_value DECIMAL(14,2) DEFAULT 0,
    unit VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store actual mapped allocations from donations to budget items
CREATE TABLE donation_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    budget_allocation_id UUID NOT NULL REFERENCES budget_allocations(id) ON DELETE RESTRICT,
    amount DECIMAL(14,2) NOT NULL,
    allocated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
