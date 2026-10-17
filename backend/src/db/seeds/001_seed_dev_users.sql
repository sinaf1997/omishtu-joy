-- Seed: 001_seed_dev_users.sql
-- Description: Optional development placeholder seed users (executed exclusively via seed runner)

INSERT INTO users (id, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev.admin@example.com',
  '$2b$12$eC.6.P6uP2fF0s5kP7XWwOqXpT8s5pE9hX2Hj0Q1l7l8y3a9d9k6.', -- hashed placeholder
  'admin',
  1
)
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  is_active = VALUES(is_active);
