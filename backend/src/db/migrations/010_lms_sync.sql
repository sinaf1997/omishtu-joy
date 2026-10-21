-- ==============================================================================
-- Migration: 010_lms_sync.sql


-- 1. LMS Synchronization Logs
CREATE TABLE IF NOT EXISTS lms_sync_logs (
  id VARCHAR(36) NOT NULL,
  sync_type ENUM('students', 'courses', 'enrollments', 'grades', 'full') NOT NULL,
  status ENUM('started', 'completed', 'failed') NOT NULL DEFAULT 'started',
  records_processed INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  error_summary TEXT NULL,
  triggered_by_staff_id VARCHAR(36) NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  INDEX idx_lms_sync_type (sync_type),
  INDEX idx_lms_sync_status (status),
  CONSTRAINT fk_lms_staff FOREIGN KEY (triggered_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
