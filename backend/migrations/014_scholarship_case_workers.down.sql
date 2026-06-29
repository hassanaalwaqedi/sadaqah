ALTER TABLE scholarship_applications
DROP COLUMN IF EXISTS assigned_to,
DROP COLUMN IF EXISTS reviewer_id,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS committee,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS sla_deadline;
