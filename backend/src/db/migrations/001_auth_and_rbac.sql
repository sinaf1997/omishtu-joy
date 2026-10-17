-- ==============================================================================
-- Migration: 001_auth_and_rbac.sql
-- Description: Core Authentication, User Identities, and Role-Based Access Control
-- ==============================================================================

-- 1. Roles Definition
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. System Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(36) NOT NULL,
  code VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code),
  INDEX idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Role-Permission Cross-Reference
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(100) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure users table has updated columns if it already existed prior to migration
SET @col_username = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');
SET @stmt_username = IF(@col_username = 0, 'ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER email, ADD UNIQUE KEY uq_users_username (username)', 'SELECT 1');
PREPARE stmt1 FROM @stmt_username; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @col_last_login = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at');
SET @stmt_last_login = IF(@col_last_login = 0, 'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER is_active', 'SELECT 1');
PREPARE stmt2 FROM @stmt_last_login; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';

-- 5. User Roles Cross-Reference
CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (token_hash),
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pr_user (user_id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
