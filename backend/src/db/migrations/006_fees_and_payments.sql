-- ==============================================================================
-- Migration: 006_fees_and_payments.sql
-- Sprint: S5
-- Description: Fee categories, course fee structures, invoices, payments, and receipts
-- ==============================================================================

-- 1. Fee Types
CREATE TABLE IF NOT EXISTS fee_types (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  is_recurring TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fee_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Course Fee Schedules
CREATE TABLE IF NOT EXISTS course_fees (
  id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  fee_type_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_fees_course_type (course_id, fee_type_id),
  CONSTRAINT fk_cf_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_cf_fee_type FOREIGN KEY (fee_type_id) REFERENCES fee_types (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Student Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  enrollment_id VARCHAR(36) NULL,
  subtotal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  status ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'issued',
  issued_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_number (invoice_number),
  INDEX idx_invoices_student (student_id),
  INDEX idx_invoices_status (status),
  CONSTRAINT fk_inv_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inv_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE SET NULL,
  CONSTRAINT fk_inv_issuer FOREIGN KEY (issued_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(36) NOT NULL,
  invoice_id VARCHAR(36) NOT NULL,
  fee_type_id VARCHAR(36) NULL,
  description VARCHAR(255) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 1,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_inv_items_invoice (invoice_id),
  CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_ii_fee_type FOREIGN KEY (fee_type_id) REFERENCES fee_types (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Payments
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) NOT NULL,
  payment_reference VARCHAR(100) NOT NULL,
  invoice_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method ENUM('cash', 'pos_card', 'bank_transfer', 'telebirr', 'cbe_birr', 'other') NOT NULL DEFAULT 'cash',
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  transaction_reference VARCHAR(150) NULL,
  notes TEXT NULL,
  received_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_ref (payment_reference),
  INDEX idx_payments_invoice (invoice_id),
  INDEX idx_payments_student (student_id),
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_cashier FOREIGN KEY (received_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Payment Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(36) NOT NULL,
  receipt_number VARCHAR(100) NOT NULL,
  payment_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  qr_code_hash VARCHAR(255) NOT NULL,
  pdf_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_receipts_number (receipt_number),
  UNIQUE KEY uq_receipts_payment (payment_id),
  CONSTRAINT fk_rec_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
