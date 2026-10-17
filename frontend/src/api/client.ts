import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types/api.js';

let authToken: string | null = sessionStorage.getItem('auth_token');

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    sessionStorage.setItem('auth_token', token);
  } else {
    sessionStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (authToken && config.headers) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Clear expired or invalid token
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);
