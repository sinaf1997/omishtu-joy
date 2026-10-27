import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { RowDataPacket } from 'mysql2/promise';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationRecord extends RowDataPacket {
  name: string;
}

/**
 * Splits a SQL file content into individual executable SQL statements,
 * discarding single-line and multi-line comments.
 */
export function splitSqlStatements(sql: string): string[] {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Executes database migrations tracked in _migrations table.
 *
 * @param closePoolOnFinish Whether to close the MySQL pool upon completion (defaults to true)
 */
export async function runMigrations(closePoolOnFinish: boolean = true): Promise<void> {
  console.log('--- Starting Database Migration Runner ---');
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  let currentMigrationFile = '';
  let currentStatementSql = '';

  try {
    // 1. Ensure migrations tracking table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Fetch already executed migrations
    const [rows] = await connection.query<MigrationRecord[]>(
      'SELECT name FROM _migrations ORDER BY id ASC'
    );
    const executedMigrations = new Set(rows.map((row) => row.name));

    // 3. Schema consistency check:
    // If _migrations lists records but the foundation 'staff' table is missing,
    // explain why and drop only the _migrations table, then re-execute.
    const [tableCheck] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'staff'`
    );
    const staffTableExists = ((tableCheck[0] as { count?: number })?.count ?? 0) > 0;

    if (!staffTableExists && rows.length > 0) {
      console.warn('⚠️ Inconsistency detected: _migrations table contains records, but table "staff" is missing.');
      console.warn('Root Cause: Migration 001 was prematurely recorded before all statements were executed.');
      console.warn('Dropping only the _migrations table and re-executing migrations from scratch...');
      await connection.query('DROP TABLE IF EXISTS _migrations');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      executedMigrations.clear();
    }

    // Check if students table exists but lacks student_code (legacy corrupted schema)
    const [studentColCheck] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'student_code'`
    );
    const studentCodeExists = ((studentColCheck[0] as { count?: number })?.count ?? 0) > 0;
    const [studentsTableCheck] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'students'`
    );
    const studentsTableExists = ((studentsTableCheck[0] as { count?: number })?.count ?? 0) > 0;

    if (studentsTableExists && !studentCodeExists) {
      console.warn('⚠️ Legacy students table detected without student_code column.');
      console.warn('Re-aligning students table with Sprint 1 foundation schema...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DROP TABLE IF EXISTS students');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.query(`DELETE FROM _migrations WHERE name = '001_auth_and_rbac.sql'`);
      executedMigrations.delete('001_auth_and_rbac.sql');
    }

    // Check if courses table exists but lacks course_type (legacy Sprint 3 draft schema)
    const [courseColCheck] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'course_type'`
    );
    const courseTypeExists = ((courseColCheck[0] as { count?: number })?.count ?? 0) > 0;
    const [coursesTableCheck] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'courses'`
    );
    const coursesTableExists = ((coursesTableCheck[0] as { count?: number })?.count ?? 0) > 0;

    if (coursesTableExists && !courseTypeExists) {
      console.warn('⚠️ Legacy courses table detected without course_type column.');
      console.warn('Re-aligning courses schema with Sprint 3 specification...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DROP TABLE IF EXISTS course_schedule_slots');
      await connection.query('DROP TABLE IF EXISTS waitlist_entries');
      await connection.query('DROP TABLE IF EXISTS enrollments');
      await connection.query('DROP TABLE IF EXISTS course_sessions');
      await connection.query('DROP TABLE IF EXISTS courses');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.query(`DELETE FROM _migrations WHERE name IN ('004_courses_and_enrollments.sql', '004_courses_and_timetables.sql')`);
      executedMigrations.delete('004_courses_and_enrollments.sql');
      executedMigrations.delete('004_courses_and_timetables.sql');
    }

    // 4. Read migration files
    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const pendingMigrations = sqlFiles.filter((file) => !executedMigrations.has(file));

    if (pendingMigrations.length === 0) {
      console.log('Database is already up to date. No pending migrations.');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):`);
    for (const migration of pendingMigrations) {
      console.log(`  - ${migration}`);
    }

    // 5. Execute each pending migration sequentially statement by statement
    for (const migrationFile of pendingMigrations) {
      currentMigrationFile = migrationFile;
      const filePath = path.join(migrationsDir, migrationFile);
      const sqlContent = await fs.readFile(filePath, 'utf-8');

      console.log(`Executing migration: ${migrationFile}...`);

      const statements = splitSqlStatements(sqlContent);
      for (const statement of statements) {
        currentStatementSql = statement;
        await connection.query(statement);
      }

      await connection.query(
        'INSERT INTO _migrations (name) VALUES (?)',
        [migrationFile]
      );

      console.log(`Successfully applied: ${migrationFile}`);
    }

    console.log('--- All migrations applied successfully ---');
  } catch (error) {
    console.error('\n❌ ===============================================');
    console.error(`❌ MIGRATION FAILED ON FILE: ${currentMigrationFile || 'initialization'}`);
    if (currentStatementSql) {
      console.error('❌ FAILING STATEMENT:');
      console.error(currentStatementSql);
    }
    console.error('❌ ERROR DETAILS:', error instanceof Error ? error.message : error);
    console.error('❌ ===============================================\n');
    throw error;
  } finally {
    connection.release();
    if (closePoolOnFinish) {
      await closeDatabasePool();
    }
  }
}

// Auto-run when invoked directly as CLI script
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigrations(true).catch(() => {
    process.exit(1);
  });
}
