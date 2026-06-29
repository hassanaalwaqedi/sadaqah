-- Migration 021: Donation Impact Tracking

-- Add status, notes, and program directly to donation_allocations
ALTER TABLE donation_allocations
    ADD COLUMN status VARCHAR(50) DEFAULT 'allocated' CHECK (status IN ('allocated', 'in_progress', 'completed')),
    ADD COLUMN notes TEXT,
    ADD COLUMN program VARCHAR(100);

-- Make budget_allocation_id optional to allow direct program allocation without strict budget line
ALTER TABLE donation_allocations
    ALTER COLUMN budget_allocation_id DROP NOT NULL;

-- Create impact_updates table
CREATE TABLE impact_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program VARCHAR(100) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
