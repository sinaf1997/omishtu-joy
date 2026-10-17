-- ==============================================================================
-- Migration: 005_attendance_and_grading.sql
-- Description: Class Sessions, Attendance, Assessments, Grades, and Certificates
-- ==============================================================================

-- 1. Cohort Class Sessions
CREATE TABLE IF NOT EXISTS cohort_sessions (
  id VARCHAR(36) NOT NULL,
  cohort_id VARCHAR(36) NOT NULL,
  session_number INT NOT NULL,
  session_date DATE NOT NULL,
  topic VARCHAR(255) NULL,
  status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cohort_session_num (cohort_id, session_number),
  INDEX idx_sessions_date (session_date),
  CONSTRAINT fk_sessions_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Daily Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  notes VARCHAR(255) NULL,
  recorded_by_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_student (session_id, student_id),
  INDEX idx_attendance_student (student_id),
  CONSTRAINT fk_att_session FOREIGN KEY (session_id) REFERENCES cohort_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_att_recorder FOREIGN KEY (recorded_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Course Assessments
CREATE TABLE IF NOT EXISTS course_assessments (
  id VARCHAR(36) NOT NULL,
  cohort_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  max_score DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
  weight_percent DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
  due_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_assessments_cohort (cohort_id),
  CONSTRAINT fk_assessments_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Assessment Student Grades
CREATE TABLE IF NOT EXISTS assessment_grades (
  id VARCHAR(36) NOT NULL,
  assessment_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  feedback TEXT NULL,
  graded_by_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_student (assessment_id, student_id),
  INDEX idx_grades_student (student_id),
  CONSTRAINT fk_grades_assessment FOREIGN KEY (assessment_id) REFERENCES course_assessments (id) ON DELETE CASCADE,
  CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_grades_grader FOREIGN KEY (graded_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Completion Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) NOT NULL,
  certificate_number VARCHAR(100) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  cohort_id VARCHAR(36) NOT NULL,
  issue_date DATE NOT NULL,
  grade_obtained VARCHAR(20) NULL,
  qr_code_hash VARCHAR(255) NOT NULL,
  pdf_file_url VARCHAR(500) NULL,
  status ENUM('issued', 'revoked') NOT NULL DEFAULT 'issued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_certificates_num (certificate_number),
  UNIQUE KEY uq_certificates_qr (qr_code_hash),
  INDEX idx_certificates_student (student_id),
  CONSTRAINT fk_certs_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_certs_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
