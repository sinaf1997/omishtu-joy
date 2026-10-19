-- ==============================================================================
-- Migration: 007_vendors_and_payables.sql
-- Sprint: S6
-- Description: Vendors, procurement bills, and cash/bank disbursements
-- ==============================================================================

-- 1. Vendors & Suppliers
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NOT NULL,
  tax_id VARCHAR(100) NULL,
  address TEXT NULL,
  vendor_type ENUM('supplier', 'service_provider', 'contractor', 'trainer') NOT NULL DEFAULT 'supplier',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vendors_phone (phone),
  INDEX idx_vendors_type (vendor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vendor Invoices (Bills)
CREATE TABLE IF NOT EXISTS vendor_invoices (
  id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  bill_number VARCHAR(100) NOT NULL,
  description TEXT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  status ENUM('pending', 'approved', 'partially_paid', 'paid', 'rejected') NOT NULL DEFAULT 'pending',
  approved_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_invoices_num (vendor_id, bill_number),
  INDEX idx_vi_status (status),
  CONSTRAINT fk_vi_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE RESTRICT,
  CONSTRAINT fk_vi_approver FOREIGN KEY (approved_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Disbursements & Payouts
CREATE TABLE IF NOT EXISTS disbursements (
  id VARCHAR(36) NOT NULL,
  disbursement_number VARCHAR(100) NOT NULL,
  vendor_invoice_id VARCHAR(36) NULL,
  recipient_type ENUM('vendor', 'trainer', 'staff', 'other') NOT NULL DEFAULT 'vendor',
  recipient_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'cheque', 'telebirr', 'other') NOT NULL DEFAULT 'bank_transfer',
  disbursement_date DATE NOT NULL,
  reference_number VARCHAR(150) NULL,
  notes TEXT NULL,
  authorized_by_staff_id VARCHAR(36) NULL,
  status ENUM('pending', 'disbursed', 'cancelled') NOT NULL DEFAULT 'disbursed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_disbursements_num (disbursement_number),
  INDEX idx_disb_recipient (recipient_type, recipient_id),
  CONSTRAINT fk_disb_vi FOREIGN KEY (vendor_invoice_id) REFERENCES vendor_invoices (id) ON DELETE SET NULL,
  CONSTRAINT fk_disb_auth FOREIGN KEY (authorized_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
