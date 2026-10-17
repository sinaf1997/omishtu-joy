-- ==============================================================================
-- Migration: 010_lms_sync.sql
-- Description: External LMS Synchronization and Executive Analytics Snapshots
-- ==============================================================================

-- 1. External LMS Service Configurations
CREATE TABLE IF NOT EXISTS lms_configs (
  id VARCHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  api_key_hash VARCHAR(255) NULL,
  sync_interval_minutes INT NOT NULL DEFAULT 60,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. LMS Synchronization Diagnostics & Logs
CREATE TABLE IF NOT EXISTS lms_sync_logs (
  id VARCHAR(36) NOT NULL,
  lms_config_id VARCHAR(36) NOT NULL,
  sync_type ENUM('students', 'courses', 'enrollments', 'grades') NOT NULL,
  records_synced INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  status ENUM('success', 'failed', 'partial') NOT NULL,
  error_details TEXT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  INDEX idx_lms_logs_config (lms_config_id),
  INDEX idx_lms_logs_status (status),
  CONSTRAINT fk_lms_logs_config FOREIGN KEY (lms_config_id) REFERENCES lms_configs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Executive Performance Analytics Snapshots
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id VARCHAR(36) NOT NULL,
  snapshot_date DATE NOT NULL,
  active_students_count INT NOT NULL DEFAULT 0,
  active_cohorts_count INT NOT NULL DEFAULT 0,
  total_revenue_month DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  total_expenses_month DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  net_profit_month DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  attendance_rate_avg DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  raw_metrics JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_analytics_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
