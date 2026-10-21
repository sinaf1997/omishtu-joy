-- ==============================================================================
-- Migration: 003_student_profiles_and_documents.sql
-- Sprint: S2 (Part 1)
-- Description: Student profiles, ID counters, emergency contacts, and schema extension
-- ==============================================================================

-- 1. Counter table for concurrency-safe atomic sequence generation
CREATE TABLE IF NOT EXISTS student_id_counters (
  year_code CHAR(2) NOT NULL,
  last_number INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (year_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Emergency Contacts Table (Minimum 1 required per student, up to 3)
CREATE TABLE IF NOT EXISTS student_emergency_contacts (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150) NULL,
  relationship VARCHAR(50) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  alternate_phone VARCHAR(30) NULL,
  alt_phone VARCHAR(50) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_student_emergency_contacts_student (student_id),
  CONSTRAINT fk_student_emergency_contacts_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- Changes to existing tables
-- ==============================================================================

-- Column: first_name
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'first_name');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT \'\' AFTER student_code', 'SELECT \'students.first_name exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: last_name
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'last_name');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name', 'SELECT \'students.last_name exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: gender
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'gender');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN gender ENUM(\'male\',\'female\') NULL AFTER last_name', 'SELECT \'students.gender exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: date_of_birth
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'date_of_birth');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN date_of_birth DATE NULL AFTER gender', 'SELECT \'students.date_of_birth exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: phone
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'phone');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN phone VARCHAR(30) NULL AFTER date_of_birth', 'SELECT \'students.phone exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: email
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'email');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN email VARCHAR(255) NULL AFTER phone', 'SELECT \'students.email exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: address
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'address');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN address VARCHAR(255) NULL AFTER email', 'SELECT \'students.address exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: city
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'city');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN city VARCHAR(100) NULL AFTER address', 'SELECT \'students.city exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: registered_by_staff_id
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'registered_by_staff_id');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN registered_by_staff_id VARCHAR(36) NULL AFTER city', 'SELECT \'students.registered_by_staff_id exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Column: registered_at
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'registered_at');
SET @sql_stmt := IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN registered_at TIMESTAMP NULL AFTER registered_by_staff_id', 'SELECT \'students.registered_at exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign Key: fk_students_registered_by_staff
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND CONSTRAINT_NAME = 'fk_students_registered_by_staff');
SET @sql_stmt := IF(@fk_exists = 0, 'ALTER TABLE students ADD CONSTRAINT fk_students_registered_by_staff FOREIGN KEY (registered_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL', 'SELECT \'fk_students_registered_by_staff exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index: idx_students_phone
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'idx_students_phone');
SET @sql_stmt := IF(@idx_exists = 0, 'ALTER TABLE students ADD INDEX idx_students_phone (phone)', 'SELECT \'idx_students_phone exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index: idx_students_last_first_name
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'idx_students_last_first_name');
SET @sql_stmt := IF(@idx_exists = 0, 'ALTER TABLE students ADD INDEX idx_students_last_first_name (last_name, first_name)', 'SELECT \'idx_students_last_first_name exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Unique Key: uq_students_email
SET @uq_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'uq_students_email');
SET @sql_stmt := IF(@uq_exists = 0, 'ALTER TABLE students ADD UNIQUE KEY uq_students_email (email)', 'SELECT \'uq_students_email exists\' AS info');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
