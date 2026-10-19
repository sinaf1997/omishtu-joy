-- ==============================================================================
-- Migration: 004_courses_and_enrollments.sql
-- Sprint: S3
-- Description: Course catalog, timetables, enrollments, and waitlists
-- ==============================================================================

-- 1. Courses
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  duration_hours INT NOT NULL DEFAULT 40,
  base_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  capacity INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Course Sessions (Timetable & Capacity)
CREATE TABLE IF NOT EXISTS course_sessions (
  id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  trainer_id VARCHAR(36) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule_days VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom VARCHAR(100) NULL,
  capacity INT NOT NULL DEFAULT 25,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_sessions_code (code),
  INDEX idx_course_sessions_course (course_id),
  INDEX idx_course_sessions_trainer (trainer_id),
  INDEX idx_course_sessions_status (status),
  CONSTRAINT fk_cs_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT,
  CONSTRAINT fk_cs_trainer FOREIGN KEY (trainer_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NULL,
  enrollment_date DATE NOT NULL,
  tuition_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  net_fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'completed', 'dropped', 'transferred') NOT NULL DEFAULT 'active',
  completion_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollments_student_course (student_id, course_id),
  INDEX idx_enrollments_session (session_id),
  INDEX idx_enrollments_status (status),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_session FOREIGN KEY (session_id) REFERENCES course_sessions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Waitlist Entries
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NULL,
  priority_number INT NOT NULL DEFAULT 1,
  status ENUM('waiting', 'offered', 'enrolled', 'cancelled') NOT NULL DEFAULT 'waiting',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_waitlist_student_course (student_id, course_id),
  INDEX idx_waitlist_session (session_id),
  INDEX idx_waitlist_status (status),
  CONSTRAINT fk_waitlist_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_waitlist_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_waitlist_session FOREIGN KEY (session_id) REFERENCES course_sessions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
