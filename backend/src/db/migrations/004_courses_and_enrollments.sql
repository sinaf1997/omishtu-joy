-- ==============================================================================
-- Migration: 004_courses_and_enrollments.sql
-- Description: Course Catalog, Classrooms, Cohorts, and Student Enrollments
-- ==============================================================================

-- 1. Course Categories
CREATE TABLE IF NOT EXISTS course_categories (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NULL,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  duration_hours INT NOT NULL DEFAULT 40,
  base_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (code),
  INDEX idx_courses_category (category_id),
  CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES course_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Classrooms & Labs
CREATE TABLE IF NOT EXISTS classrooms (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 25,
  location VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Cohorts / Batches
CREATE TABLE IF NOT EXISTS cohorts (
  id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  trainer_id VARCHAR(36) NULL,
  classroom_id VARCHAR(36) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule_days VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_students INT NOT NULL DEFAULT 30,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cohorts_code (code),
  INDEX idx_cohorts_course (course_id),
  INDEX idx_cohorts_trainer (trainer_id),
  INDEX idx_cohorts_status (status),
  CONSTRAINT fk_cohorts_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT,
  CONSTRAINT fk_cohorts_trainer FOREIGN KEY (trainer_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_cohorts_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  cohort_id VARCHAR(36) NOT NULL,
  enrollment_date DATE NOT NULL,
  tuition_fee DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  net_fee DECIMAL(12, 2) NOT NULL,
  status ENUM('active', 'completed', 'dropped', 'transferred') NOT NULL DEFAULT 'active',
  completion_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollments_student_cohort (student_id, cohort_id),
  INDEX idx_enrollments_cohort (cohort_id),
  INDEX idx_enrollments_status (status),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
