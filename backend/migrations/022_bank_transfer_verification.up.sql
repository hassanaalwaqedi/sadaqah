-- Migration 022: Bank Transfer Verification System

-- 1. Drop existing status check constraint
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;

-- 2. Add new columns
ALTER TABLE donations
    ADD COLUMN reference_number VARCHAR(100) UNIQUE,
    ADD COLUMN receipt_file_obj VARCHAR(500),
    ADD COLUMN transfer_date TIMESTAMPTZ,
    ADD COLUMN bank_name VARCHAR(100),
    ADD COLUMN finance_notes TEXT;

-- 3. Re-add status check constraint with new statuses
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (
    status IN (
        'draft', 
        'waiting_transfer', 
        'pending_verification', 
        'need_info', 
        'approved', 
        'rejected', 
        'completed', 
        'failed', 
        'refunded', 
        'archived'
    )
);

-- Note: We assume existing rows have status 'pending', 'completed', 'failed', or 'refunded'.
-- Wait, the previous constraint had 'pending', but the new one does NOT have 'pending'. 
-- Let me add 'pending' as well just to be safe so existing rows don't break.
ALTER TABLE donations DROP CONSTRAINT donations_status_check;
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (
    status IN (
        'pending',
        'draft', 
        'waiting_transfer', 
        'pending_verification', 
        'need_info', 
        'approved', 
        'rejected', 
        'completed', 
        'failed', 
        'refunded', 
        'archived'
    )
);

CREATE INDEX idx_donations_ref_num ON donations(reference_number);
