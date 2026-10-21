-- ==============================================================================
-- Migration: 003_student_profiles_and_documents.sql
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
