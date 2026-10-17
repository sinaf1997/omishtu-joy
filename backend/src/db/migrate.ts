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

async function runMigrations(): Promise<void> {
  console.log('--- Starting Database Migration Runner ---');
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

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

    // 3. Read migration files
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

    // 4. Execute each pending migration sequentially
    for (const migrationFile of pendingMigrations) {
      const filePath = path.join(migrationsDir, migrationFile);
      const sqlContent = await fs.readFile(filePath, 'utf-8');

      console.log(`Executing migration: ${migrationFile}...`);

      // Note: In MySQL, DDL statements trigger an implicit commit and cannot be rolled back
      // within standard transactions. We execute and record each migration individually.
      await connection.query(sqlContent);

      await connection.query(
        'INSERT INTO _migrations (name) VALUES (?)',
        [migrationFile]
      );

      console.log(`Successfully applied: ${migrationFile}`);
    }

    console.log('--- All migrations applied successfully ---');
  } catch (error) {
    console.error('Migration failed!');
    console.error(error);
    process.exit(1);
  } finally {
    connection.release();
    await closeDatabasePool();
  }
}

runMigrations();
