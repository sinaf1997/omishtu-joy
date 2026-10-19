-- ==============================================================================
-- Migration: 002_seed_roles_permissions.sql
-- Sprint: S1
-- Description: Seed the 6 Core Staff Roles and Granular Module Permissions
-- ==============================================================================

-- 1. Insert the 6 Staff System Roles
INSERT INTO roles (id, name, display_name, description, is_system)
VALUES
  ('role-owner', 'owner', 'Center Owner', 'Full administrative authority and financial governance', 1),
  ('role-manager', 'manager', 'Operations Manager', 'Operational oversight, schedule sign-off, and staff management', 1),
  ('role-academic-admin', 'academic_admin', 'Academic Administrator', 'Course catalog, cohorts, timetable planning, and graduation', 1),
  ('role-trainer', 'trainer', 'Course Trainer / Instructor', 'Class attendance, assessments, and student performance grading', 1),
  ('role-accountant', 'accountant', 'Finance & Accountant', 'Tuition invoicing, payment cashiering, AR/AP, and bank reconciliation', 1),
  ('role-receptionist', 'receptionist', 'Front Desk / Receptionist', 'In-person student intake, inquiry logging, and credential issuance', 1)
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  description = VALUES(description);

-- 2. Insert Standard System Permissions
INSERT INTO permissions (id, code, module, description)
VALUES
  -- Staff Administration (Sprint 1)
  ('perm-000', 'staff:manage', 'staff', 'Create, update roles, and deactivate staff member accounts'),
  
  -- Student Management (Sprint 2)
  ('perm-001', 'students:read', 'students', 'View student directories and profiles'),
  ('perm-002', 'students:create', 'students', 'Register new students in-person'),
  ('perm-003', 'students:edit', 'students', 'Update student profiles and documents'),
  ('perm-004', 'students:delete', 'students', 'Archive or remove student records'),

  -- Courses & Scheduling (Sprint 3)
  ('perm-010', 'courses:read', 'courses', 'View course catalog and cohort schedules'),
  ('perm-011', 'courses:manage', 'courses', 'Create and modify courses, batches, and classrooms'),
  ('perm-012', 'enrollments:manage', 'courses', 'Enroll students into cohorts and issue timetable notices'),

  -- Attendance & Grading (Sprint 4)
  ('perm-020', 'attendance:mark', 'academics', 'Record daily classroom session attendance'),
  ('perm-021', 'grades:entry', 'academics', 'Enter student assessment scores and feedback'),
  ('perm-022', 'certificates:issue', 'academics', 'Generate and verify completion certificates'),

  -- Financial Cashiering & Invoicing (Sprint 5)
  ('perm-030', 'fees:invoicing', 'finance', 'Create tuition fee schedules and invoices'),
  ('perm-031', 'payments:cashier', 'finance', 'Accept cash/POS payments and generate receipts'),
  ('perm-032', 'finance:reports', 'finance', 'View financial summaries and revenue statements'),

  -- Payables & Vendors (Sprint 6)
  ('perm-040', 'payables:manage', 'vendors', 'Manage vendor bills and approve trainer disbursements'),

  -- General Ledger & Reconciliation (Sprint 7)
  ('perm-050', 'ledger:manage', 'accounting', 'Manage chart of accounts, journal entries, and bank reconciliation'),

  -- Governance & Compliance (Sprint 8)
  ('perm-060', 'audit:read', 'compliance', 'Inspect immutable system activity audit logs'),
  ('perm-061', 'budgets:manage', 'compliance', 'Configure departmental budgets and tax parameters'),

  -- LMS & Integration (Sprint 9)
  ('perm-070', 'lms:sync', 'integrations', 'Trigger LMS synchronization and view sync diagnostics')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

-- 3. Map Permissions to Owner (All Permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-owner', id FROM permissions;

-- 4. Map Permissions to Manager
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-manager', id FROM permissions
WHERE code IN (
  'students:read', 'students:create', 'students:edit',
  'courses:read', 'courses:manage', 'enrollments:manage',
  'attendance:mark', 'grades:entry', 'certificates:issue',
  'fees:invoicing', 'payments:cashier', 'finance:reports',
  'payables:manage', 'audit:read', 'lms:sync'
);

-- 5. Map Permissions to Academic Admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-academic-admin', id FROM permissions
WHERE code IN (
  'students:read', 'students:create', 'students:edit',
  'courses:read', 'courses:manage', 'enrollments:manage',
  'attendance:mark', 'grades:entry', 'certificates:issue',
  'lms:sync'
);

-- 6. Map Permissions to Trainer
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-trainer', id FROM permissions
WHERE code IN (
  'courses:read', 'attendance:mark', 'grades:entry'
);

-- 7. Map Permissions to Accountant
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-accountant', id FROM permissions
WHERE code IN (
  'students:read', 'fees:invoicing', 'payments:cashier',
  'finance:reports', 'payables:manage', 'ledger:manage', 'budgets:manage'
);

-- 8. Map Permissions to Receptionist
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role-receptionist', id FROM permissions
WHERE code IN (
  'students:read', 'students:create', 'courses:read', 'enrollments:manage', 'payments:cashier'
);
