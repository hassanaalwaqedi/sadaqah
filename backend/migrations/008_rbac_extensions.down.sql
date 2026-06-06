-- ============================================================
-- Migration 008: Rollback RBAC Extensions
-- ============================================================

-- Remove new role-permission mappings for new roles
DELETE FROM role_permissions WHERE role_id IN (
    SELECT id FROM roles WHERE name IN (
        'org_admin', 'scholarship_manager', 'housing_manager',
        'innovation_manager', 'financial_officer', 'support_employee',
        'volunteer', 'guest', 'system_service'
    )
);

-- Remove new roles
DELETE FROM roles WHERE name IN (
    'org_admin', 'scholarship_manager', 'housing_manager',
    'innovation_manager', 'financial_officer', 'support_employee',
    'volunteer', 'guest', 'system_service'
);

-- Remove new permissions
DELETE FROM permissions WHERE (resource, action) IN (
    ('roles', 'read'), ('roles', 'create'), ('roles', 'update'),
    ('roles', 'delete'), ('roles', 'assign'),
    ('scholarships', 'approve'), ('scholarships', 'manage'),
    ('housing', 'assign'), ('housing', 'manage'),
    ('innovation', 'review'), ('innovation', 'score'), ('innovation', 'manage'),
    ('finance', 'write'), ('finance', 'manage'),
    ('donations', 'manage'),
    ('reports', 'generate'),
    ('notifications', 'send'), ('notifications', 'manage'),
    ('system', 'settings'), ('system', 'monitor'), ('system', 'backup'),
    ('ai', 'manage'), ('ai', 'read'),
    ('files', 'manage'), ('files', 'read'), ('files', 'delete')
);

-- Remove audit_logs extensions
ALTER TABLE audit_logs DROP COLUMN IF EXISTS request_id;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS success;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS target_user_id;

-- Remove roles extensions
ALTER TABLE roles DROP COLUMN IF EXISTS is_active;
ALTER TABLE roles DROP COLUMN IF EXISTS updated_at;

-- Remove group_id from permissions
ALTER TABLE permissions DROP COLUMN IF EXISTS group_id;

-- Drop permission_groups
DROP TABLE IF EXISTS permission_groups;
