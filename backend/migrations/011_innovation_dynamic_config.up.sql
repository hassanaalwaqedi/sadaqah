-- Drop old constraint
ALTER TABLE innovation_events DROP CONSTRAINT innovation_events_status_check;

-- Add new constraint with 'archived' and 'upcoming'
ALTER TABLE innovation_events ADD CONSTRAINT innovation_events_status_check 
CHECK (status IN ('draft', 'upcoming', 'open', 'judging', 'completed', 'archived'));

-- Add JSONB columns
ALTER TABLE innovation_events ADD COLUMN configuration JSONB DEFAULT '{}'::jsonb;
ALTER TABLE project_submissions ADD COLUMN extra_data JSONB DEFAULT '{}'::jsonb;

-- Also update project_submissions status to include more states
ALTER TABLE project_submissions DROP CONSTRAINT project_submissions_status_check;

-- Add new constraint with 'accepted', 'rejected', 'archived', 'reviewing' etc
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'technical_review', 'under_judging', 'interview', 'scored', 'accepted', 'rejected', 'winner', 'archived'));
