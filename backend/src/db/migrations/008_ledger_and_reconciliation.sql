-- ==============================================================================
-- Migration: 008_ledger_and_reconciliation.sql
-- Description: Double-Entry General Ledger, Chart of Accounts, and Bank Reconciliation
-- ==============================================================================

-- 1. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id VARCHAR(36) NOT NULL,
  account_code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
  parent_id VARCHAR(36) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coa_code (account_code),
  INDEX idx_coa_type (account_type),
  CONSTRAINT fk_coa_parent FOREIGN KEY (parent_id) REFERENCES chart_of_accounts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Journal Entries (General Ledger Header)
CREATE TABLE IF NOT EXISTS journal_entries (
  id VARCHAR(36) NOT NULL,
  entry_number VARCHAR(50) NOT NULL,
  entry_date DATE NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id VARCHAR(36) NULL,
  description TEXT NOT NULL,
  status ENUM('draft', 'posted', 'void') NOT NULL DEFAULT 'posted',
  posted_by_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_je_number (entry_number),
  INDEX idx_je_date (entry_date),
  INDEX idx_je_status (status),
  CONSTRAINT fk_je_poster FOREIGN KEY (posted_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Journal Items (Double-Entry Debit/Credit Lines)
CREATE TABLE IF NOT EXISTS journal_items (
  id VARCHAR(36) NOT NULL,
  journal_entry_id VARCHAR(36) NOT NULL,
  account_id VARCHAR(36) NOT NULL,
  debit DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  credit DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  INDEX idx_ji_entry (journal_entry_id),
  INDEX idx_ji_account (account_id),
  CONSTRAINT fk_ji_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_ji_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(36) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  current_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  gl_account_id VARCHAR(36) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ba_gl FOREIGN KEY (gl_account_id) REFERENCES chart_of_accounts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bank Statement Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id VARCHAR(36) NOT NULL,
  bank_account_id VARCHAR(36) NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  reference_number VARCHAR(100) NULL,
  is_reconciled TINYINT(1) NOT NULL DEFAULT 0,
  journal_entry_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bt_bank (bank_account_id),
  INDEX idx_bt_date (transaction_date),
  CONSTRAINT fk_bt_bank FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_bt_je FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bank Reconciliation Sessions
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id VARCHAR(36) NOT NULL,
  bank_account_id VARCHAR(36) NOT NULL,
  statement_date DATE NOT NULL,
  statement_balance DECIMAL(14, 2) NOT NULL,
  gl_balance DECIMAL(14, 2) NOT NULL,
  difference DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  status ENUM('in_progress', 'reconciled') NOT NULL DEFAULT 'in_progress',
  reconciled_by_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_br_bank (bank_account_id),
  CONSTRAINT fk_br_bank FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_br_reconciler FOREIGN KEY (reconciled_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
