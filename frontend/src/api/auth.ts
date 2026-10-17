import { apiClient, setAuthToken } from './client.js';
import { ApiResponse } from '../types/api.js';
import { AuthResponse, LoginCredentials, User } from '../types/auth.js';

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Login failed');
  }
  setAuthToken(response.data.data.token);
  return response.data.data;
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch user session');
  }
  return response.data.data;
}
