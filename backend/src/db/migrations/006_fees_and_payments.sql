-- ==============================================================================
-- Migration: 006_fees_and_payments.sql
-- Description: Tuition Invoicing, Fee Installments, Cashiering, and Receipts
-- ==============================================================================

-- 1. Student Invoices
CREATE TABLE IF NOT EXISTS student_invoices (
  id VARCHAR(36) NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  enrollment_id VARCHAR(36) NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  discount_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(12, 2) NOT NULL,
  status ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'issued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_number (invoice_number),
  INDEX idx_invoices_student (student_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_due_date (due_date),
  CONSTRAINT fk_inv_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_inv_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(36) NOT NULL,
  invoice_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_inv_items_invoice (invoice_id),
  CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id) REFERENCES student_invoices (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Fee Installment Schedules
CREATE TABLE IF NOT EXISTS fee_installments (
  id VARCHAR(36) NOT NULL,
  invoice_id VARCHAR(36) NOT NULL,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'partially_paid', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (id),
  INDEX idx_installments_invoice (invoice_id),
  CONSTRAINT fk_inst_invoice FOREIGN KEY (invoice_id) REFERENCES student_invoices (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Payment Receipts & Cashier Transactions
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) NOT NULL,
  receipt_number VARCHAR(50) NOT NULL,
  invoice_id VARCHAR(36) NULL,
  student_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('cash', 'pos_card', 'bank_transfer', 'check', 'online') NOT NULL,
  transaction_reference VARCHAR(100) NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by_id VARCHAR(36) NOT NULL,
  notes TEXT NULL,
  status ENUM('confirmed', 'voided', 'refunded') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_receipt (receipt_number),
  INDEX idx_payments_student (student_id),
  INDEX idx_payments_invoice (invoice_id),
  INDEX idx_payments_date (payment_date),
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES student_invoices (id) ON DELETE SET NULL,
  CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_cashier FOREIGN KEY (received_by_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
