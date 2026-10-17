export type UserRole = 'admin' | 'staff' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface UserJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
