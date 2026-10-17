export type UserRole = 'admin' | 'staff' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
