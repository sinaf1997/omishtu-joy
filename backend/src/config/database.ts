import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from './env.js';

let pool: Pool | null = null;

/**
 * Returns the singleton MySQL connection pool.
 */
export function getDatabasePool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      dateStrings: true,
      multipleStatements: true,
    });
  }
  return pool;
}

/**
 * Verifies database connectivity without leaking credentials.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  database: string;
  host: string;
  error?: string;
}> {
  try {
    const currentPool = getDatabasePool();
    const connection = await currentPool.getConnection();
    try {
      await connection.query('SELECT 1');
      return {
        connected: true,
        database: env.DB_NAME,
        host: env.DB_HOST,
      };
    } finally {
      connection.release();
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    return {
      connected: false,
      database: env.DB_NAME,
      host: env.DB_HOST,
      error: errorMessage,
    };
  }
}

/**
 * Executes a callback within a managed database transaction.
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const currentPool = getDatabasePool();
  const connection = await currentPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Closes the connection pool during graceful shutdown.
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
