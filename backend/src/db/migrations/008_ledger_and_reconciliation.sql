-- ==============================================================================
-- Migration: 008_ledger_and_reconciliation.sql
-- Sprint: S7
-- Description: Chart of accounts, multi-currency, double-entry ledger, and bank reconciliation
-- ==============================================================================

-- 1. Currencies
CREATE TABLE IF NOT EXISTS currencies (
  id VARCHAR(36) NOT NULL,
  code VARCHAR(3) NOT NULL,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  is_base TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_currencies_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Currency Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id VARCHAR(36) NOT NULL,
  from_currency_id VARCHAR(36) NOT NULL,
  to_currency_id VARCHAR(36) NOT NULL,
  rate DECIMAL(15, 6) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exchange_rates_pair (from_currency_id, to_currency_id, effective_date),
  CONSTRAINT fk_er_from FOREIGN KEY (from_currency_id) REFERENCES currencies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_er_to FOREIGN KEY (to_currency_id) REFERENCES currencies (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) NOT NULL,
  account_code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
  parent_id VARCHAR(36) NULL,
  currency_id VARCHAR(36) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_code (account_code),
  INDEX idx_accounts_type (type),
  CONSTRAINT fk_acc_parent FOREIGN KEY (parent_id) REFERENCES accounts (id) ON DELETE SET NULL,
  CONSTRAINT fk_acc_curr FOREIGN KEY (currency_id) REFERENCES currencies (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. General Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id VARCHAR(36) NOT NULL,
  entry_number VARCHAR(100) NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(150) NULL,
  status ENUM('draft', 'posted', 'voided') NOT NULL DEFAULT 'draft',
  created_by_staff_id VARCHAR(36) NULL,
  posted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_je_entry_num (entry_number),
  INDEX idx_je_date (entry_date),
  INDEX idx_je_status (status),
  CONSTRAINT fk_je_staff FOREIGN KEY (created_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Journal Line Items
CREATE TABLE IF NOT EXISTS journal_lines (
  id VARCHAR(36) NOT NULL,
  journal_entry_id VARCHAR(36) NOT NULL,
  account_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NULL,
  debit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  credit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_jl_entry (journal_entry_id),
  INDEX idx_jl_account (account_id),
  CONSTRAINT fk_jl_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_jl_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bank Statements
CREATE TABLE IF NOT EXISTS bank_statements (
  id VARCHAR(36) NOT NULL,
  account_id VARCHAR(36) NOT NULL,
  statement_date DATE NOT NULL,
  opening_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  closing_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  file_url VARCHAR(500) NULL,
  status ENUM('imported', 'reconciled') NOT NULL DEFAULT 'imported',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bs_account (account_id),
  CONSTRAINT fk_bs_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bank Statement Lines
CREATE TABLE IF NOT EXISTS bank_statement_lines (
  id VARCHAR(36) NOT NULL,
  statement_id VARCHAR(36) NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference VARCHAR(150) NULL,
  amount DECIMAL(15, 2) NOT NULL,
  is_reconciled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bsl_statement (statement_id),
  CONSTRAINT fk_bsl_statement FOREIGN KEY (statement_id) REFERENCES bank_statements (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reconciliation Matches
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id VARCHAR(36) NOT NULL,
  statement_line_id VARCHAR(36) NOT NULL,
  journal_line_id VARCHAR(36) NOT NULL,
  matched_by_staff_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rec_statement_line (statement_line_id),
  CONSTRAINT fk_rec_stat_line FOREIGN KEY (statement_line_id) REFERENCES bank_statement_lines (id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_jl FOREIGN KEY (journal_line_id) REFERENCES journal_lines (id) ON DELETE RESTRICT,
  CONSTRAINT fk_rec_staff FOREIGN KEY (matched_by_staff_id) REFERENCES staff (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
