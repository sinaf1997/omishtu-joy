-- ==============================================================================
-- Migration: 010_lms_sync.sql
-- Sprint: S9
-- Description: External LMS synchronization logs and LMS foreign identifier columns
-- ==============================================================================

-- ==============================================================================
-- Changes to existing tables
-- ==============================================================================

-- 1. Add lms_user_id to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'lms_user_id');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN lms_user_id VARCHAR(100) NULL AFTER student_code, ADD UNIQUE KEY uq_students_lms_id (lms_user_id)', 'SELECT ''students.lms_user_id already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Add lms_course_id to courses
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'lms_course_id');
SET @sql := IF(@c = 0, 'ALTER TABLE courses ADD COLUMN lms_course_id VARCHAR(100) NULL AFTER code, ADD UNIQUE KEY uq_courses_lms_id (lms_course_id)', 'SELECT ''courses.lms_course_id already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ==============================================================================
-- Tables in dependency order
-- ==============================================================================

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
