-- ============================================================
-- Migration 016: Fix Project Submissions Foreign Key
-- ============================================================

ALTER TABLE project_submissions DROP CONSTRAINT IF EXISTS project_submissions_category_id_fkey;
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES innovation_events(id) ON DELETE CASCADE;
