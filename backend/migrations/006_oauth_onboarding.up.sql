-- ============================================================
-- Migration 006: Google OAuth & Mandatory Student Onboarding
-- ============================================================

-- 1. Alter Users Table
ALTER TABLE users 
    ADD COLUMN provider VARCHAR(20) DEFAULT 'LOCAL',
    ADD COLUMN provider_id VARCHAR(255),
    ADD COLUMN avatar_url TEXT,
    ADD COLUMN profile_completed BOOLEAN DEFAULT false,
    ALTER COLUMN password_hash DROP NOT NULL;

-- Ensure existing users don't get locked out
UPDATE users SET profile_completed = true WHERE created_at < NOW();

-- 2. Create Student Profiles Table
CREATE TABLE student_profiles (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    phone_number     VARCHAR(50),
    nationality      VARCHAR(100),
    country          VARCHAR(100),
    city             VARCHAR(100),
    university_name  VARCHAR(200),
    faculty          VARCHAR(200),
    department       VARCHAR(200),
    academic_year    SMALLINT,
    gpa              DECIMAL(4,2),
    housing_required BOOLEAN DEFAULT false,
    family_income    DECIMAL(14,2),
    emergency_contact VARCHAR(200),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
