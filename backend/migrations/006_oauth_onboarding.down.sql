-- ============================================================
-- Migration 006: Revert Google OAuth & Mandatory Student Onboarding
-- ============================================================

DROP TABLE IF EXISTS student_profiles;

ALTER TABLE users 
    DROP COLUMN provider,
    DROP COLUMN provider_id,
    DROP COLUMN avatar_url,
    DROP COLUMN profile_completed;

-- We can't easily restore NOT NULL on password_hash if we added users without passwords,
-- so we'll leave password_hash as nullable to prevent down migration failure if OAuth users exist.
