-- Migration 019: Enterprise Budget Management (Down)

ALTER TABLE financial_transactions
    DROP COLUMN IF EXISTS budget_allocation_id;

DROP TABLE IF EXISTS budget_limits;
DROP TABLE IF EXISTS budget_funding_sources;

ALTER TABLE budget_allocations
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS notes,
    DROP COLUMN IF EXISTS created_at;

ALTER TABLE budgets
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS department_id,
    DROP COLUMN IF EXISTS program_id,
    DROP COLUMN IF EXISTS start_date,
    DROP COLUMN IF EXISTS end_date,
    DROP COLUMN IF EXISTS currency,
    DROP COLUMN IF EXISTS type,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS reserved_amount,
    DROP COLUMN IF EXISTS created_by,
    DROP COLUMN IF EXISTS approved_by,
    DROP COLUMN IF EXISTS notes,
    DROP COLUMN IF EXISTS updated_at;
