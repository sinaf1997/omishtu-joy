import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  StaffMemberRecord,
  CreateStaffPayload,
  CreateStaffResponse,
  StaffRole,
  StaffStats,
  RoleRecord,
  UpdateStaffPayload,
  ResetPasswordResponse,
} from '../types/auth.js';

export async function listStaffApi(): Promise<StaffMemberRecord[]> {
  const response = await apiClient.get<ApiResponse<StaffMemberRecord[]>>('/users');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch staff members');
  }
  return response.data.data;
}

export async function getStaffStatsApi(): Promise<StaffStats> {
  const response = await apiClient.get<ApiResponse<StaffStats>>('/users/stats');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch staff stats');
  }
  return response.data.data;
}

export async function listRolesApi(): Promise<RoleRecord[]> {
  const response = await apiClient.get<ApiResponse<RoleRecord[]>>('/roles');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch roles');
  }
  return response.data.data;
}

export async function createStaffApi(payload: CreateStaffPayload): Promise<CreateStaffResponse> {
  const response = await apiClient.post<ApiResponse<CreateStaffResponse>>('/users', payload);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create staff member');
  }
  return response.data.data;
}

export async function updateStaffApi(id: string, payload: UpdateStaffPayload): Promise<StaffMemberRecord> {
  const response = await apiClient.patch<ApiResponse<StaffMemberRecord>>(`/users/${id}`, payload);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update staff member');
  }
  return response.data.data;
}

export async function resetStaffPasswordApi(id: string): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ApiResponse<ResetPasswordResponse>>(`/users/${id}/reset-password`);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to reset staff password');
  }
  return response.data.data;
}

// Backward compatibility aliases
export async function updateStaffRoleApi(id: string, role: StaffRole): Promise<StaffMemberRecord> {
  return updateStaffApi(id, { role });
}

export async function updateStaffStatusApi(id: string, isActive: boolean): Promise<StaffMemberRecord> {
  return updateStaffApi(id, { isActive });
}
