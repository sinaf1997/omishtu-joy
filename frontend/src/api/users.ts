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
  ListUsersParams,
  ListUsersResponse,
} from '../types/auth.js';

export async function listStaffApi(params?: ListUsersParams): Promise<StaffMemberRecord[]> {
  const response = await apiClient.get<ApiResponse<StaffMemberRecord[]>>('/users', { params });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch users');
  }
  return response.data.data;
}

export async function listUsersApi(params?: ListUsersParams): Promise<ListUsersResponse> {
  const response = await apiClient.get<ApiResponse<StaffMemberRecord[]>>('/users', { params });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch users');
  }
  const users = response.data.data;
  const meta = response.data.meta as { total?: number; page?: number; limit?: number; totalPages?: number } | undefined;
  return {
    users,
    total: meta?.total ?? users.length,
    page: meta?.page ?? (params?.page || 1),
    limit: meta?.limit ?? (params?.limit || 10),
    totalPages: meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? users.length) / (params?.limit || 10))),
  };
}

export async function getStaffStatsApi(): Promise<StaffStats> {
  const response = await apiClient.get<ApiResponse<StaffStats>>('/users/stats');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch user statistics');
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
    throw new Error(response.data.error?.message || 'Failed to create user');
  }
  return response.data.data;
}

export async function updateStaffApi(id: string, payload: UpdateStaffPayload): Promise<StaffMemberRecord> {
  const body: Record<string, unknown> = {};
  if (payload.fullName !== undefined || payload.full_name !== undefined) {
    body.full_name = payload.fullName ?? payload.full_name;
  }
  if (payload.phone !== undefined) {
    body.phone = payload.phone;
  }
  if (payload.role !== undefined) {
    body.role = payload.role;
  }
  if (payload.roleId !== undefined || payload.role_id !== undefined) {
    body.role_id = payload.roleId ?? payload.role_id;
  }
  if (payload.isActive !== undefined || payload.is_active !== undefined) {
    body.is_active = payload.isActive ?? payload.is_active;
  }

  const response = await apiClient.patch<ApiResponse<StaffMemberRecord>>(`/users/${id}`, body);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update user');
  }
  return response.data.data;
}

export async function resetStaffPasswordApi(id: string): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ApiResponse<ResetPasswordResponse>>(`/users/${id}/reset-password`);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to reset user password');
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
