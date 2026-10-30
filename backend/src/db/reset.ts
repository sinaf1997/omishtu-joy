import { RowDataPacket } from 'mysql2/promise';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';
import { env } from '../config/env.js';

export async function resetDatabase(): Promise<void> {
  console.log('--- Resetting DEV Database ---');
  if (env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: Refusing to reset database in production environment!');
    process.exit(1);
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const [tables] = await connection.query<RowDataPacket[]>('SHOW TABLES');
    for (const row of tables) {
      const tableName = Object.values(row)[0] as string;
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`Dropped table: ${tableName}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('DEV database tables wiped cleanly.');
  } finally {
    connection.release();
    await closeDatabasePool();
  }
}

if (process.argv[1] && process.argv[1].endsWith('reset.ts')) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database reset failed:', err);
      process.exit(1);
    });
}
