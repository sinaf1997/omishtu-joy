-- ==============================================================================
-- Migration: 003_student_profiles_and_documents.sql
-- Sprint: S2
-- Description: Student intake profiles, emergency contacts, and document repository
-- ==============================================================================

-- ==============================================================================
-- Changes to existing tables
-- ==============================================================================

-- 1. Add first_name to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'first_name');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN first_name VARCHAR(100) NULL AFTER student_code', 'SELECT ''students.first_name already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Add last_name to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'last_name');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name', 'SELECT ''students.last_name already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add email to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'email');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN email VARCHAR(255) NULL AFTER last_name', 'SELECT ''students.email already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Add phone to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'phone');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN phone VARCHAR(50) NULL AFTER email', 'SELECT ''students.phone already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Add alt_phone to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'alt_phone');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN alt_phone VARCHAR(50) NULL AFTER phone', 'SELECT ''students.alt_phone already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Add gender to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'gender');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN gender ENUM(''male'', ''female'', ''other'') NULL AFTER alt_phone', 'SELECT ''students.gender already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. Add date_of_birth to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'date_of_birth');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN date_of_birth DATE NULL AFTER gender', 'SELECT ''students.date_of_birth already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8. Add national_id to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'national_id');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN national_id VARCHAR(100) NULL AFTER date_of_birth', 'SELECT ''students.national_id already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9. Add address to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'address');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN address TEXT NULL AFTER national_id', 'SELECT ''students.address already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 10. Add city to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'city');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN city VARCHAR(100) NULL AFTER address', 'SELECT ''students.city already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 11. Add photo_url to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'photo_url');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN photo_url VARCHAR(500) NULL AFTER city', 'SELECT ''students.photo_url already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 12. Add intake_date to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'intake_date');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN intake_date DATE NULL AFTER photo_url', 'SELECT ''students.intake_date already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 13. Add enrollment_status to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'enrollment_status');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN enrollment_status ENUM(''inquiry'', ''registered'', ''enrolled'', ''completed'', ''dropped'', ''suspended'') NOT NULL DEFAULT ''registered'' AFTER intake_date', 'SELECT ''students.enrollment_status already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 14. Add notes to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'notes');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN notes TEXT NULL AFTER enrollment_status', 'SELECT ''students.notes already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 15. Add created_by_staff_id to students
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'created_by_staff_id');
SET @sql := IF(@c = 0, 'ALTER TABLE students ADD COLUMN created_by_staff_id VARCHAR(36) NULL AFTER notes, ADD INDEX idx_students_creator (created_by_staff_id), ADD CONSTRAINT fk_students_creator FOREIGN KEY (created_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL', 'SELECT ''students.created_by_staff_id already exists - skipped'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ==============================================================================
-- Tables in dependency order
-- ==============================================================================

-- 1. Emergency Contacts
CREATE TABLE IF NOT EXISTS student_emergency_contacts (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  alt_phone VARCHAR(50) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sec_student (student_id),
  CONSTRAINT fk_sec_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Student Documents & Attachments
CREATE TABLE IF NOT EXISTS student_documents (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  document_type ENUM('national_id', 'photo', 'educational_cert', 'contract', 'other') NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  uploaded_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sdoc_student (student_id),
  INDEX idx_sdoc_uploader (uploaded_by_staff_id),
  CONSTRAINT fk_sdoc_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_sdoc_uploader FOREIGN KEY (uploaded_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
