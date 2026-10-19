import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  PortalType,
  StaffRole,
  StaffLoginCredentials,
  StudentLoginCredentials,
  ChangePasswordPayload,
} from '../types/auth.js';
import {
  loginStaffApi,
  loginStudentApi,
  changePasswordApi,
  getMeApi,
} from '../api/auth.js';
import {
  setAuthToken,
  getAuthToken,
  registerUnauthorizedHandler,
} from '../api/client.js';

export function getStaffDashboardPath(role: StaffRole): string {
  switch (role) {
    case 'owner':
      return '/staff/owner';
    case 'receptionist':
      return '/staff/reception';
    case 'academic_admin':
      return '/staff/academics';
    case 'trainer':
      return '/staff/trainer';
    case 'accountant':
      return '/staff/accounting';
    case 'manager':
      return '/staff/manager';
    default:
      return '/staff/owner';
  }
}

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  portal: PortalType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginStaff: (credentials: StaffLoginCredentials) => Promise<User>;
  loginStudent: (credentials: StudentLoginCredentials) => Promise<User>;
  changePassword: (payload: ChangePasswordPayload) => Promise<User>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  // Listen to 401 unauthorized errors from axios interceptor
  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      logout();
    });
    return unregister;
  }, [logout]);

  const restoreSession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const loginStaff = async (credentials: StaffLoginCredentials): Promise<User> => {
    const data = await loginStaffApi(credentials);
    setUser(data.user);
    return data.user;
  };

  const loginStudent = async (credentials: StudentLoginCredentials): Promise<User> => {
    const data = await loginStudentApi(credentials);
    setUser(data.user);
    return data.user;
  };

  const changePassword = async (payload: ChangePasswordPayload): Promise<User> => {
    const data = await changePasswordApi(payload);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        portal: user?.portal || null,
        isAuthenticated: !!user,
        isLoading,
        loginStaff,
        loginStudent,
        changePassword,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
