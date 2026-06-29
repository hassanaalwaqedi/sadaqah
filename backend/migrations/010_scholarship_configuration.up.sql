-- Add configuration JSONB column to scholarship_cycles
ALTER TABLE scholarship_cycles ADD COLUMN configuration JSONB DEFAULT '{}'::jsonb;
