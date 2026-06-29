ALTER TABLE innovation_events DROP CONSTRAINT IF EXISTS innovation_events_status_check;
ALTER TABLE innovation_events ADD CONSTRAINT innovation_events_status_check 
CHECK (status IN ('draft', 'open', 'judging', 'completed'));

ALTER TABLE innovation_events DROP COLUMN IF EXISTS configuration;
ALTER TABLE project_submissions DROP COLUMN IF EXISTS extra_data;

ALTER TABLE project_submissions DROP CONSTRAINT IF EXISTS project_submissions_status_check;
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_status_check 
CHECK (status IN ('draft', 'submitted', 'under_judging', 'scored', 'winner'));
