-- Migration 022: Bank Transfer Verification System (Down)

DROP INDEX IF EXISTS idx_donations_ref_num;

ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;

ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
);

ALTER TABLE donations
    DROP COLUMN IF EXISTS reference_number,
    DROP COLUMN IF EXISTS receipt_file_obj,
    DROP COLUMN IF EXISTS transfer_date,
    DROP COLUMN IF EXISTS bank_name,
    DROP COLUMN IF EXISTS finance_notes;
