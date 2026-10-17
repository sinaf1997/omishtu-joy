import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import { User, UserRecord, CreateUserData } from './users.types.js';

function mapRecordToUser(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email,
    passwordHash: record.password_hash,
    role: record.role,
    isActive: Boolean(record.is_active),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<RowDataPacket[] & UserRecord[]>(
      'SELECT id, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    return mapRecordToUser(rows[0] as UserRecord);
  }

  async findById(id: string): Promise<User | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<RowDataPacket[] & UserRecord[]>(
      'SELECT id, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return mapRecordToUser(rows[0] as UserRecord);
  }

  async create(userData: CreateUserData): Promise<User> {
    const pool = getDatabasePool();
    const isActive = userData.isActive ?? true;

    await pool.query<ResultSetHeader>(
      'INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [userData.id, userData.email, userData.passwordHash, userData.role, isActive ? 1 : 0]
    );

    const user = await this.findById(userData.id);
    if (!user) {
      throw new Error('Failed to retrieve newly created user');
    }
    return user;
  }
}

export const usersRepository = new UsersRepository();
