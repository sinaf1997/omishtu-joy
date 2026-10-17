-- ==============================================================================
-- Migration: 007_vendors_and_payables.sql
-- Description: Vendors, Accounts Payable, Supplier Bills, and Trainer Disbursements
-- ==============================================================================

-- 1. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(150) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  tax_id VARCHAR(100) NULL,
  payment_terms_days INT NOT NULL DEFAULT 30,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vendors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vendor Bills (Accounts Payable)
CREATE TABLE IF NOT EXISTS vendor_bills (
  id VARCHAR(36) NOT NULL,
  bill_number VARCHAR(100) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  category ENUM('equipment', 'utilities', 'software_license', 'facilities', 'trainer_payout', 'other') NOT NULL,
  description TEXT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'approved', 'partially_paid', 'paid', 'disputed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vbills_vendor (vendor_id),
  INDEX idx_vbills_status (status),
  INDEX idx_vbills_due (due_date),
  CONSTRAINT fk_vbills_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Vendor Payment Vouchers
CREATE TABLE IF NOT EXISTS vendor_payments (
  id VARCHAR(36) NOT NULL,
  payment_voucher_number VARCHAR(50) NOT NULL,
  bill_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('bank_transfer', 'check', 'cash') NOT NULL,
  reference_number VARCHAR(100) NULL,
  payment_date DATE NOT NULL,
  approved_by_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vpayments_voucher (payment_voucher_number),
  INDEX idx_vpayments_bill (bill_id),
  CONSTRAINT fk_vpayments_bill FOREIGN KEY (bill_id) REFERENCES vendor_bills (id) ON DELETE RESTRICT,
  CONSTRAINT fk_vpayments_approver FOREIGN KEY (approved_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Trainer Remuneration / Payouts
CREATE TABLE IF NOT EXISTS trainer_payouts (
  id VARCHAR(36) NOT NULL,
  payout_number VARCHAR(50) NOT NULL,
  trainer_id VARCHAR(36) NOT NULL,
  cohort_id VARCHAR(36) NULL,
  amount DECIMAL(12, 2) NOT NULL,
  hours_billed DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  payout_date DATE NOT NULL,
  status ENUM('draft', 'approved', 'disbursed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tpayouts_num (payout_number),
  INDEX idx_tpayouts_trainer (trainer_id),
  CONSTRAINT fk_tpayouts_trainer FOREIGN KEY (trainer_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_tpayouts_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
