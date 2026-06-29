-- ============================================================
-- Migration 027: Drop Housing Module
-- Drops tables and roles/permissions related to the housing module.
-- ============================================================

-- 1. Drop Tables and Columns
DROP TABLE IF EXISTS housing_invoices CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS room_allocations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;

ALTER TABLE student_profiles DROP COLUMN IF EXISTS housing_required;

-- 2. Remove Roles and Permissions
DELETE FROM role_permissions 
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('housing_admin', 'housing_manager'));

DELETE FROM user_roles 
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('housing_admin', 'housing_manager'));

DELETE FROM roles WHERE name IN ('housing_admin', 'housing_manager');

DELETE FROM permissions WHERE resource = 'housing';
DELETE FROM permission_groups WHERE name = 'housing';
