-- ==============================================================================
-- Migration: 004_courses_and_enrollments.sql
-- Sprint: S3 (Part 1, 2 & 3)
-- Description: Course catalog, timetables, student enrollments, and waitlists
-- ==============================================================================

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) NOT NULL,
  code VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  course_type ENUM('major', 'elective') NOT NULL,
  duration_weeks SMALLINT UNSIGNED NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity SMALLINT UNSIGNED NOT NULL,
  trainer_id VARCHAR(36) NULL,
  location VARCHAR(100) NULL,
  status ENUM('draft', 'open', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  created_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_courses_code UNIQUE (code),
  INDEX idx_courses_course_type (course_type),
  INDEX idx_courses_status (status),
  INDEX idx_courses_trainer_id (trainer_id),
  INDEX idx_courses_start_end_date (start_date, end_date),
  CONSTRAINT fk_courses_trainer FOREIGN KEY (trainer_id) REFERENCES staff (id) ON DELETE SET NULL,
  CONSTRAINT fk_courses_created_by_staff FOREIGN KEY (created_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Course Schedule Slots (Weekly Timetable)
CREATE TABLE IF NOT EXISTS course_schedule_slots (
  id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_course_schedule_slots_course_id (course_id),
  INDEX idx_course_schedule_slots_day_start (day_of_week, start_time),
  CONSTRAINT fk_course_schedule_slots_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'completed', 'dropped', 'cancelled') NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enrolled_by_staff_id VARCHAR(36) NULL,
  source ENUM('direct', 'waitlist') NOT NULL DEFAULT 'direct',
  dropped_at TIMESTAMP NULL,
  drop_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_enrollments_student_course UNIQUE (student_id, course_id),
  INDEX idx_enrollments_course_status (course_id, status),
  INDEX idx_enrollments_student_status (student_id, status),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_enrolled_by_staff FOREIGN KEY (enrolled_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Waitlist Entries Table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  status ENUM('waiting', 'promoted', 'removed') NOT NULL DEFAULT 'waiting',
  request_source ENUM('course_full', 'student_request') NOT NULL DEFAULT 'course_full',
  added_by_staff_id VARCHAR(36) NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by_staff_id VARCHAR(36) NULL,
  removal_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_waitlist_entries_student_course UNIQUE (student_id, course_id),
  INDEX idx_waitlist_entries_course_status (course_id, status),
  INDEX idx_waitlist_entries_course_status_source (course_id, status, request_source),
  CONSTRAINT fk_waitlist_entries_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_waitlist_entries_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_waitlist_entries_added_by_staff FOREIGN KEY (added_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL,
  CONSTRAINT fk_waitlist_entries_resolved_by_staff FOREIGN KEY (resolved_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
