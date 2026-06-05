-- ============================================================
-- Migration 001: Core Tables (Users, Roles, Permissions)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    email_verified  BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- ── Roles ──
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) UNIQUE NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Permissions ──
CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource    VARCHAR(100) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE(resource, action)
);

-- ── User ↔ Roles (Many-to-Many) ──
CREATE TABLE user_roles (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ── Role ↔ Permissions (Many-to-Many) ──
CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ── User Profiles ──
CREATE TABLE user_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name_en   VARCHAR(100) NOT NULL,
    first_name_ar   VARCHAR(100),
    last_name_en    VARCHAR(100) NOT NULL,
    last_name_ar    VARCHAR(100),
    phone           VARCHAR(20),
    date_of_birth   DATE,
    gender          VARCHAR(10) CHECK (gender IN ('male', 'female')),
    nationality     VARCHAR(100),
    national_id     VARCHAR(50),
    university      VARCHAR(200),
    major           VARCHAR(200),
    gpa             DECIMAL(4,2) CHECK (gpa IS NULL OR (gpa >= 0 AND gpa <= 4.0)),
    academic_year   SMALLINT,
    avatar_file_id  UUID,
    address         TEXT,
    bio             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Refresh Tokens ──
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent  TEXT,
    ip_address  INET
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked = false;

-- ── Login Attempts ──
CREATE TABLE login_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    ip_address  INET NOT NULL,
    success     BOOLEAN NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent  TEXT
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email, attempted_at);

-- ── Audit Logs ──
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ── Files ──
CREATE TABLE files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name   VARCHAR(500) NOT NULL,
    stored_name     VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    size_bytes      BIGINT NOT NULL,
    storage_path    VARCHAR(1000) NOT NULL,
    storage_backend VARCHAR(20) DEFAULT 'local',
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ── Notifications ──
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(300) NOT NULL,
    body        TEXT NOT NULL,
    data        JSONB,
    is_read     BOOLEAN DEFAULT false,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id) WHERE is_read = false;

-- ── Notification Preferences ──
CREATE TABLE notification_preferences (
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    channel           VARCHAR(20) NOT NULL CHECK (channel IN ('in_app', 'email', 'both', 'none')),
    PRIMARY KEY (user_id, notification_type)
);

-- Add FK from user_profiles to files (now that files table exists)
ALTER TABLE user_profiles
    ADD CONSTRAINT fk_profile_avatar FOREIGN KEY (avatar_file_id) REFERENCES files(id) ON DELETE SET NULL;

-- ============================================================
-- Seed: Default Roles
-- ============================================================

INSERT INTO roles (name, display_name_en, display_name_ar, description, is_system) VALUES
    ('super_admin',       'Super Administrator', 'مدير النظام',          'Full system access',                              true),
    ('admin',             'Administrator',       'مسؤول',               'General administration access',                     true),
    ('scholarship_admin', 'Scholarship Admin',   'مسؤول المنح',          'Scholarship module administration',                true),
    ('housing_admin',     'Housing Admin',       'مسؤول السكن',          'Student housing administration',                   true),
    ('student',           'Student',             'طالب',                'Default role for students',                         true),
    ('judge',             'Judge',               'محكم',                'Evaluates applications and projects',              true),
    ('donor',             'Donor',               'متبرع',               'Can make donations and view campaigns',            true),
    ('researcher',        'Researcher',          'باحث',                'Can submit research proposals and track grants',   true),
    ('auditor',           'Financial Auditor',   'مدقق مالي',            'Can view financial reports and transactions',      true);

-- ============================================================
-- Seed: Core Permissions
-- ============================================================

INSERT INTO permissions (resource, action, description) VALUES
    -- Users
    ('users', 'read',    'View user details'),
    ('users', 'create',  'Create new users'),
    ('users', 'update',  'Update user details'),
    ('users', 'delete',  'Delete users'),
    ('users', 'manage',  'Full user management'),

    -- Scholarships
    ('scholarships', 'read',    'View scholarships'),
    ('scholarships', 'create',  'Create scholarship cycles'),
    ('scholarships', 'update',  'Update scholarship cycles'),
    ('scholarships', 'delete',  'Delete scholarship cycles'),
    ('scholarships', 'apply',   'Apply for scholarships'),
    ('scholarships', 'evaluate','Evaluate scholarship applications'),
    ('scholarships', 'rank',    'Trigger AI ranking'),

    -- Housing
    ('housing', 'read',    'View housing information'),
    ('housing', 'create',  'Create housing entries'),
    ('housing', 'update',  'Update housing entries'),
    ('housing', 'delete',  'Delete housing entries'),
    ('housing', 'apply',   'Apply for housing'),
    ('housing', 'allocate','Allocate rooms'),

    -- Innovation
    ('innovation', 'read',    'View innovation events'),
    ('innovation', 'create',  'Create innovation events'),
    ('innovation', 'update',  'Update innovation events'),
    ('innovation', 'submit',  'Submit innovation projects'),
    ('innovation', 'judge',   'Judge innovation projects'),

    -- Donations
    ('donations', 'read',    'View donations'),
    ('donations', 'create',  'Create campaigns'),
    ('donations', 'donate',  'Make donations'),

    -- Finance
    ('finance', 'read',    'View financial data'),
    ('finance', 'create',  'Create financial records'),
    ('finance', 'approve', 'Approve expenses'),
    ('finance', 'audit',   'Access audit reports'),

    -- Reports
    ('reports', 'read',    'View reports'),
    ('reports', 'export',  'Export reports'),

    -- Admin
    ('admin', 'access',       'Access admin panel'),
    ('admin', 'audit_logs',   'View audit logs'),
    ('admin', 'system_health','View system health');

-- ============================================================
-- Seed: Role ↔ Permission Assignments
-- ============================================================

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin';

-- Admin gets most permissions (except super admin specific)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.resource NOT IN ('admin');

-- Scholarship Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'scholarship_admin'
AND (p.resource = 'scholarships' OR (p.resource = 'reports' AND p.action = 'read'));

-- Housing Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'housing_admin'
AND (p.resource = 'housing' OR (p.resource = 'reports' AND p.action = 'read'));

-- Student
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'student'
AND ((p.resource = 'scholarships' AND p.action = 'apply')
  OR (p.resource = 'housing' AND p.action = 'apply')
  OR (p.resource = 'innovation' AND p.action = 'submit')
  OR (p.resource = 'scholarships' AND p.action = 'read')
  OR (p.resource = 'housing' AND p.action = 'read')
  OR (p.resource = 'innovation' AND p.action = 'read'));

-- Judge
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'judge'
AND ((p.resource = 'scholarships' AND p.action IN ('read', 'evaluate'))
  OR (p.resource = 'innovation' AND p.action IN ('read', 'judge')));

-- Donor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'donor'
AND ((p.resource = 'donations' AND p.action IN ('read', 'donate')));

-- Auditor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'auditor'
AND ((p.resource = 'finance' AND p.action IN ('read', 'audit'))
  OR (p.resource = 'reports' AND p.action IN ('read', 'export'))
  OR (p.resource = 'donations' AND p.action = 'read'));
