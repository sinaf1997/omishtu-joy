-- ==============================================================================
-- Migration: 005_attendance_and_grading.sql
-- Sprint: S4
-- Description: Attendance sessions, records, assessments, grades, certificates, and alerts
-- ==============================================================================

-- 1. Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  session_number INT NOT NULL,
  session_date DATE NOT NULL,
  topic VARCHAR(255) NULL,
  conducted_by_staff_id VARCHAR(36) NULL,
  status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_att_session_num (session_id, session_number),
  INDEX idx_att_sessions_date (session_date),
  CONSTRAINT fk_attsess_course_session FOREIGN KEY (session_id) REFERENCES course_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_attsess_staff FOREIGN KEY (conducted_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Daily Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(36) NOT NULL,
  attendance_session_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  notes VARCHAR(255) NULL,
  recorded_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_att_rec_session_student (attendance_session_id, student_id),
  INDEX idx_att_rec_student (student_id),
  CONSTRAINT fk_attrec_session FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_attrec_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_attrec_staff FOREIGN KEY (recorded_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  max_score DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
  weight_percent DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
  due_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_assessments_course (course_id),
  CONSTRAINT fk_assessments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Assessment Scores
CREATE TABLE IF NOT EXISTS assessment_scores (
  id VARCHAR(36) NOT NULL,
  assessment_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  feedback TEXT NULL,
  graded_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_score_assessment_student (assessment_id, student_id),
  INDEX idx_scores_student (student_id),
  CONSTRAINT fk_scores_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE,
  CONSTRAINT fk_scores_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_scores_grader FOREIGN KEY (graded_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Final Grades
CREATE TABLE IF NOT EXISTS final_grades (
  id VARCHAR(36) NOT NULL,
  enrollment_id VARCHAR(36) NOT NULL,
  total_score DECIMAL(5, 2) NOT NULL,
  letter_grade VARCHAR(10) NOT NULL,
  is_passing TINYINT(1) NOT NULL DEFAULT 1,
  finalized_by_staff_id VARCHAR(36) NULL,
  finalized_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_final_grades_enrollment (enrollment_id),
  CONSTRAINT fk_fg_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE,
  CONSTRAINT fk_fg_staff FOREIGN KEY (finalized_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Completion Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) NOT NULL,
  certificate_number VARCHAR(100) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  issue_date DATE NOT NULL,
  grade_obtained VARCHAR(20) NULL,
  qr_code_hash VARCHAR(255) NOT NULL,
  pdf_file_url VARCHAR(500) NULL,
  status ENUM('issued', 'revoked') NOT NULL DEFAULT 'issued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_certificates_num (certificate_number),
  UNIQUE KEY uq_certificates_qr (qr_code_hash),
  INDEX idx_certificates_student (student_id),
  CONSTRAINT fk_certs_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_certs_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. System & Portal Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) NOT NULL,
  recipient_portal ENUM('staff', 'student') NOT NULL,
  recipient_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link_url VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notif_recipient (recipient_portal, recipient_id),
  INDEX idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
