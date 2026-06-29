DROP TABLE IF EXISTS research_publications CASCADE;
DROP TABLE IF EXISTS research_team_members CASCADE;
DROP TABLE IF EXISTS research_projects CASCADE;
DROP TABLE IF EXISTS research_grant_programs CASCADE;

ALTER TABLE innovation_events DROP COLUMN IF EXISTS event_type;
