-- Migration 018: Finance Module V2 enhancements

-- Drop existing mock data to ensure clean slate for the new operations platform
DELETE FROM financial_transactions;
DELETE FROM expense_approvals;
DELETE FROM expense_requests;

-- Alter financial_transactions table
ALTER TABLE financial_transactions
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paid', 'cancelled', 'archived')),
    ADD COLUMN source VARCHAR(200),
    ADD COLUMN destination VARCHAR(200),
    ADD COLUMN receipt_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    ADD COLUMN invoice_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN notes TEXT,
    ADD COLUMN audit_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Alter expense_requests table
ALTER TABLE expense_requests
    ADD COLUMN invoice_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    ADD COLUMN receipt_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    ADD COLUMN category VARCHAR(100),
    ADD COLUMN notes TEXT,
    ADD COLUMN audit_history JSONB DEFAULT '[]'::jsonb;

-- Create finance_audit_logs table for immutable system-wide logging
CREATE TABLE finance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'transaction', 'expense', 'budget'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'approve', 'reject', 'delete'
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_finance_audit_entity ON finance_audit_logs(entity_type, entity_id);
