import { getDatabasePool, closeDatabasePool } from '../config/database.js';

async function inspectDb() {
  const pool = getDatabasePool();
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('=== SHOW TABLES ===');
    console.table(tables);

    const [studentCols] = await pool.query('DESCRIBE students');
    console.log('\n=== DESCRIBE students ===');
    console.table(studentCols);

    const [countersCols] = await pool.query('DESCRIBE student_id_counters');
    console.log('\n=== DESCRIBE student_id_counters ===');
    console.table(countersCols);

    const [contactsCols] = await pool.query('DESCRIBE student_emergency_contacts');
    console.log('\n=== DESCRIBE student_emergency_contacts ===');
    console.table(contactsCols);
  } catch (e) {
    console.error('Inspection error:', e);
  } finally {
    await closeDatabasePool();
  }
}

inspectDb();
