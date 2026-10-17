-- ==============================================================================
-- Migration: 009_tax_budgets_and_audit.sql
-- Description: Tax Withholding Configurations, Departmental Budgets, and Audit Trails
-- ==============================================================================

-- 1. Tax & Withholding Configurations
CREATE TABLE IF NOT EXISTS tax_rates (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate_percent DECIMAL(5, 2) NOT NULL,
  is_withholding TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Departmental Budgets
CREATE TABLE IF NOT EXISTS departmental_budgets (
  id VARCHAR(36) NOT NULL,
  department VARCHAR(100) NOT NULL,
  fiscal_year INT NOT NULL,
  allocated_amount DECIMAL(14, 2) NOT NULL,
  spent_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dept_fiscal_year (department, fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Immutable System Activity Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created_at (created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
