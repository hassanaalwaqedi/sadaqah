-- Revert Migration 021

DROP TABLE IF EXISTS impact_updates;

ALTER TABLE donation_allocations
    DROP COLUMN status,
    DROP COLUMN notes,
    DROP COLUMN program;

-- Re-add NOT NULL constraint if necessary (might fail if nulls exist)
-- ALTER TABLE donation_allocations ALTER COLUMN budget_allocation_id SET NOT NULL;
