-- Migration 018: Finance Module V2 enhancements - DOWN

DROP TABLE IF EXISTS finance_audit_logs;

ALTER TABLE expense_requests
    DROP COLUMN IF EXISTS invoice_file_id,
    DROP COLUMN IF EXISTS receipt_file_id,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS notes,
    DROP COLUMN IF EXISTS audit_history;

ALTER TABLE financial_transactions
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS source,
    DROP COLUMN IF EXISTS destination,
    DROP COLUMN IF EXISTS receipt_file_id,
    DROP COLUMN IF EXISTS invoice_file_id,
    DROP COLUMN IF EXISTS approved_by,
    DROP COLUMN IF EXISTS notes,
    DROP COLUMN IF EXISTS audit_history,
    DROP COLUMN IF EXISTS updated_at;
