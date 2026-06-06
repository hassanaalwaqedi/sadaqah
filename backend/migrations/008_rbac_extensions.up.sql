-- ============================================================
-- Migration 008: Enterprise RBAC Extensions
-- Extends existing RBAC with permission groups, additional
-- roles/permissions, and enhanced audit logging.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. PERMISSION GROUPS (organize permissions by domain)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS permission_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO permission_groups (name, description, sort_order) VALUES
    ('users_and_roles',  'User management and role administration', 1),
    ('scholarships',     'Scholarship program management',          2),
    ('housing',          'Student housing management',              3),
    ('innovation',       'Innovation and competitions',             4),
    ('finance',          'Financial operations',                    5),
    ('donations',        'Donation and campaign management',        6),
    ('reports',          'Reporting and analytics',                 7),
    ('system',           'System administration',                   8),
    ('notifications',    'Notification management',                 9),
    ('files',            'File management',                        10),
    ('ai',               'AI operations',                          11)
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2. EXTEND PERMISSIONS TABLE (add group reference)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES permission_groups(id) ON DELETE SET NULL;

-- Link existing permissions to groups
UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'users_and_roles')
WHERE resource = 'users' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'scholarships')
WHERE resource = 'scholarships' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'housing')
WHERE resource = 'housing' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'innovation')
WHERE resource = 'innovation' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'donations')
WHERE resource = 'donations' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'finance')
WHERE resource = 'finance' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'reports')
WHERE resource = 'reports' AND group_id IS NULL;

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'system')
WHERE resource = 'admin' AND group_id IS NULL;

-- ══════════════════════════════════════════════════════════════
-- 3. EXTEND ROLES TABLE (add is_active and updated_at)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ══════════════════════════════════════════════════════════════
-- 4. ENHANCE AUDIT LOGS (request_id, success, target)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_target_user ON audit_logs(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ══════════════════════════════════════════════════════════════
-- 5. SEED MISSING ROLES
-- ══════════════════════════════════════════════════════════════

INSERT INTO roles (name, display_name_en, display_name_ar, description, is_system) VALUES
    ('org_admin',          'Organization Admin',    'مدير المنظمة',       'Daily operations management without system-level access',  true),
    ('scholarship_manager','Scholarship Manager',   'مدير المنح',         'Full scholarship program management',                      true),
    ('housing_manager',    'Housing Manager',       'مدير السكن',         'Full housing program management',                          true),
    ('innovation_manager', 'Innovation Manager',    'مدير الابتكار',       'Innovation and competition management',                   true),
    ('financial_officer',  'Financial Officer',     'المسؤول المالي',      'Financial operations and reporting',                      true),
    ('support_employee',   'Support Employee',      'موظف الدعم',         'Customer support and assistance',                         true),
    ('volunteer',          'Volunteer',             'متطوع',              'Volunteer with limited access',                            true),
    ('guest',              'Guest',                 'زائر',               'Minimal read-only access',                                true),
    ('system_service',     'System Service Account','حساب خدمة النظام',    'Automated system operations',                            true)
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 6. SEED MISSING PERMISSIONS
-- ══════════════════════════════════════════════════════════════

INSERT INTO permissions (resource, action, description, group_id) VALUES
    -- Roles management
    ('roles', 'read',   'View role details',                (SELECT id FROM permission_groups WHERE name = 'users_and_roles')),
    ('roles', 'create', 'Create new roles',                 (SELECT id FROM permission_groups WHERE name = 'users_and_roles')),
    ('roles', 'update', 'Update role details',              (SELECT id FROM permission_groups WHERE name = 'users_and_roles')),
    ('roles', 'delete', 'Delete/deactivate roles',          (SELECT id FROM permission_groups WHERE name = 'users_and_roles')),
    ('roles', 'assign', 'Assign roles to users',            (SELECT id FROM permission_groups WHERE name = 'users_and_roles')),

    -- Scholarship extras
    ('scholarships', 'approve', 'Approve scholarship applications', (SELECT id FROM permission_groups WHERE name = 'scholarships')),
    ('scholarships', 'manage',  'Full scholarship management',      (SELECT id FROM permission_groups WHERE name = 'scholarships')),

    -- Housing extras
    ('housing', 'assign',  'Assign housing units',         (SELECT id FROM permission_groups WHERE name = 'housing')),
    ('housing', 'manage',  'Full housing management',      (SELECT id FROM permission_groups WHERE name = 'housing')),

    -- Innovation extras
    ('innovation', 'review', 'Review innovation submissions', (SELECT id FROM permission_groups WHERE name = 'innovation')),
    ('innovation', 'score',  'Score innovation projects',     (SELECT id FROM permission_groups WHERE name = 'innovation')),
    ('innovation', 'manage', 'Full innovation management',    (SELECT id FROM permission_groups WHERE name = 'innovation')),

    -- Finance extras
    ('finance', 'write',    'Create financial records',    (SELECT id FROM permission_groups WHERE name = 'finance')),
    ('finance', 'manage',   'Full financial management',   (SELECT id FROM permission_groups WHERE name = 'finance')),

    -- Donations extras
    ('donations', 'manage', 'Full donation management',    (SELECT id FROM permission_groups WHERE name = 'donations')),

    -- Reports extras
    ('reports', 'generate', 'Generate new reports',        (SELECT id FROM permission_groups WHERE name = 'reports')),

    -- Notifications
    ('notifications', 'send',   'Send notifications',     (SELECT id FROM permission_groups WHERE name = 'notifications')),
    ('notifications', 'manage', 'Manage notification settings', (SELECT id FROM permission_groups WHERE name = 'notifications')),

    -- System
    ('system', 'settings', 'Manage system settings',      (SELECT id FROM permission_groups WHERE name = 'system')),
    ('system', 'monitor',  'View system monitoring',       (SELECT id FROM permission_groups WHERE name = 'system')),
    ('system', 'backup',   'Manage system backups',        (SELECT id FROM permission_groups WHERE name = 'system')),

    -- AI
    ('ai', 'manage', 'Manage AI operations',               (SELECT id FROM permission_groups WHERE name = 'ai')),
    ('ai', 'read',   'View AI job status',                  (SELECT id FROM permission_groups WHERE name = 'ai')),

    -- Files
    ('files', 'manage', 'Full file management',             (SELECT id FROM permission_groups WHERE name = 'files')),
    ('files', 'read',   'View/download files',              (SELECT id FROM permission_groups WHERE name = 'files')),
    ('files', 'delete', 'Delete files',                     (SELECT id FROM permission_groups WHERE name = 'files'))
ON CONFLICT (resource, action) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 7. MAP PERMISSIONS TO NEW ROLES
-- ══════════════════════════════════════════════════════════════

-- Super Admin gets ALL permissions (including new ones)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Organization Admin: everything except system-level and role management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'org_admin'
AND p.resource NOT IN ('system', 'ai')
AND NOT (p.resource = 'roles' AND p.action IN ('create', 'delete'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Scholarship Manager: scholarships + reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'scholarship_manager'
AND (p.resource = 'scholarships'
  OR (p.resource = 'reports' AND p.action IN ('read', 'generate'))
  OR (p.resource = 'users' AND p.action = 'read')
  OR (p.resource = 'notifications' AND p.action = 'send')
  OR (p.resource = 'files' AND p.action IN ('read', 'manage')))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Housing Manager: housing + reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'housing_manager'
AND (p.resource = 'housing'
  OR (p.resource = 'reports' AND p.action IN ('read', 'generate'))
  OR (p.resource = 'users' AND p.action = 'read')
  OR (p.resource = 'notifications' AND p.action = 'send')
  OR (p.resource = 'files' AND p.action IN ('read', 'manage')))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Innovation Manager: innovation + reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'innovation_manager'
AND (p.resource = 'innovation'
  OR (p.resource = 'reports' AND p.action IN ('read', 'generate'))
  OR (p.resource = 'users' AND p.action = 'read')
  OR (p.resource = 'notifications' AND p.action = 'send')
  OR (p.resource = 'files' AND p.action IN ('read', 'manage')))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Financial Officer: finance + donations read + reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'financial_officer'
AND (p.resource = 'finance'
  OR (p.resource = 'donations' AND p.action IN ('read', 'manage'))
  OR (p.resource = 'reports' AND p.action IN ('read', 'generate', 'export'))
  OR (p.resource = 'notifications' AND p.action = 'send'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Support Employee: users read, basic access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'support_employee'
AND ((p.resource = 'users' AND p.action = 'read')
  OR (p.resource = 'scholarships' AND p.action = 'read')
  OR (p.resource = 'housing' AND p.action = 'read')
  OR (p.resource = 'notifications' AND p.action = 'send')
  OR (p.resource = 'files' AND p.action = 'read'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Volunteer: minimal read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'volunteer'
AND ((p.resource = 'donations' AND p.action IN ('read', 'donate'))
  OR (p.resource = 'innovation' AND p.action = 'read'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Guest: read-only on public resources
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'guest'
AND p.action = 'read'
AND p.resource IN ('donations', 'innovation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Also update existing admin role to get new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.resource NOT IN ('system')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Update scholarship_admin with new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'scholarship_admin'
AND (p.resource = 'scholarships' OR (p.resource = 'reports' AND p.action IN ('read', 'generate')))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Update housing_admin with new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'housing_admin'
AND (p.resource = 'housing' OR (p.resource = 'reports' AND p.action IN ('read', 'generate')))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Judge gets innovation scoring
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'judge'
AND ((p.resource = 'innovation' AND p.action IN ('read', 'review', 'score'))
  OR (p.resource = 'scholarships' AND p.action IN ('read', 'evaluate')))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Auditor gets finance audit and reports.generate
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'auditor'
AND ((p.resource = 'finance' AND p.action IN ('read', 'audit'))
  OR (p.resource = 'reports' AND p.action IN ('read', 'export', 'generate'))
  OR (p.resource = 'donations' AND p.action = 'read'))
ON CONFLICT (role_id, permission_id) DO NOTHING;
