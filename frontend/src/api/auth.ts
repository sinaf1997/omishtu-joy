import { apiClient, setAuthToken } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  AuthResponse,
  StaffLoginCredentials,
  StudentLoginCredentials,
  ChangePasswordPayload,
  User,
} from '../types/auth.js';

export async function loginStaffApi(credentials: StaffLoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/staff/login', credentials);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Staff login failed');
  }
  setAuthToken(response.data.data.token);
  return response.data.data;
}

export async function loginStudentApi(credentials: StudentLoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/student/login', credentials);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Student login failed');
  }
  setAuthToken(response.data.data.token);
  return response.data.data;
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/change-password', payload);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Password update failed');
  }
  setAuthToken(response.data.data.token);
  return response.data.data;
}

export async function updateProfileApi(fullName: string): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', {
    full_name: fullName,
  });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update profile');
  }
  return response.data.data;
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch user session');
  }
  return response.data.data;
}
