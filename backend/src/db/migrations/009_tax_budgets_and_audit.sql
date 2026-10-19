-- ==============================================================================
-- Migration: 009_tax_budgets_and_audit.sql
-- Sprint: S8
-- Description: Tax compliance, departmental budgets, and immutable audit logs
-- ==============================================================================

-- 1. Tax Rules
CREATE TABLE IF NOT EXISTS tax_rules (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tax_rules_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tax Transactions
CREATE TABLE IF NOT EXISTS tax_transactions (
  id VARCHAR(36) NOT NULL,
  tax_rule_id VARCHAR(36) NOT NULL,
  taxable_amount DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) NOT NULL,
  reference_type ENUM('invoice', 'disbursement', 'journal') NOT NULL,
  reference_id VARCHAR(36) NOT NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tt_rule (tax_rule_id),
  INDEX idx_tt_ref (reference_type, reference_id),
  CONSTRAINT fk_tt_rule FOREIGN KEY (tax_rule_id) REFERENCES tax_rules (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  manager_staff_id VARCHAR(36) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dept_code (code),
  CONSTRAINT fk_dept_manager FOREIGN KEY (manager_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id VARCHAR(36) NOT NULL,
  department_id VARCHAR(36) NOT NULL,
  fiscal_year INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  total_budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status ENUM('draft', 'approved', 'closed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budget_dept_year (department_id, fiscal_year),
  CONSTRAINT fk_budget_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Budget Line Items
CREATE TABLE IF NOT EXISTS budget_lines (
  id VARCHAR(36) NOT NULL,
  budget_id VARCHAR(36) NOT NULL,
  category VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  spent_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bl_budget (budget_id),
  CONSTRAINT fk_bl_budget FOREIGN KEY (budget_id) REFERENCES budgets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Activity Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL,
  actor_type ENUM('staff', 'student', 'system') NOT NULL DEFAULT 'staff',
  actor_id VARCHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  target_id VARCHAR(36) NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_actor (actor_type, actor_id),
  INDEX idx_audit_entity (target_entity, target_id),
  INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Audit Log Immutability Triggers
DROP TRIGGER IF EXISTS trg_audit_logs_no_update;
CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable record: UPDATE operations on audit_logs are prohibited';

DROP TRIGGER IF EXISTS trg_audit_logs_no_delete;
CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable record: DELETE operations on audit_logs are prohibited';
