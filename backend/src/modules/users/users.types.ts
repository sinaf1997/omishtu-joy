import { UserRole } from '../../types/index.js';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}
