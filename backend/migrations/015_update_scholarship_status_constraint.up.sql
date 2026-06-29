-- ============================================================
-- Migration 015: Update Scholarship Status Constraint
-- ============================================================

ALTER TABLE scholarship_applications DROP CONSTRAINT IF EXISTS scholarship_applications_status_check;
ALTER TABLE scholarship_applications ADD CONSTRAINT scholarship_applications_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'evaluation', 'ranked', 'accepted', 'rejected', 'withdrawn', 'missing_documents', 'approved', 'interview', 'awarded'));
