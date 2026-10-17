import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '../types/auth.js';
import { loginApi, getMeApi } from '../api/auth.js';
import { setAuthToken, getAuthToken } from '../api/client.js';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials: LoginCredentials) => {
    const data = await loginApi(credentials);
    setUser(data.user);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
