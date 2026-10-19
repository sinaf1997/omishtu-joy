import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  StaffMemberRecord,
  CreateStaffPayload,
  CreateStaffResponse,
  StaffRole,
} from '../types/auth.js';

export async function listStaffApi(): Promise<StaffMemberRecord[]> {
  const response = await apiClient.get<ApiResponse<StaffMemberRecord[]>>('/users');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch staff members');
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

export async function updateStaffRoleApi(id: string, role: StaffRole): Promise<StaffMemberRecord> {
  const response = await apiClient.patch<ApiResponse<StaffMemberRecord>>(`/users/${id}/role`, { role });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update staff role');
  }
  return response.data.data;
}

export async function updateStaffStatusApi(id: string, isActive: boolean): Promise<StaffMemberRecord> {
  const response = await apiClient.patch<ApiResponse<StaffMemberRecord>>(`/users/${id}/status`, { isActive });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update staff status');
  }
  return response.data.data;
}
