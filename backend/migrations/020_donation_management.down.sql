-- Migration 020: Enterprise Donor Management

DROP TABLE IF EXISTS donation_allocations;
DROP TABLE IF EXISTS campaign_impact_metrics;

ALTER TABLE donations
    DROP COLUMN IF EXISTS donation_type,
    DROP COLUMN IF EXISTS allocation_status,
    DROP COLUMN IF EXISTS restricted_fund_id,
    DROP COLUMN IF EXISTS notes;

ALTER TABLE campaigns
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS visibility,
    DROP COLUMN IF EXISTS priority;
