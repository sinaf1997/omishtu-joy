import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  StudentRecord,
  StudentStats,
  ListStudentsParams,
  ListStudentsResponse,
  CreateStudentPayload,
} from '../types/students.js';

export async function listStudentsApi(params?: ListStudentsParams): Promise<ListStudentsResponse> {
  const response = await apiClient.get<ApiResponse<StudentRecord[]>>('/students', { params });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch students');
  }
  const students = response.data.data;
  const meta = response.data.meta as { total?: number; page?: number; limit?: number; totalPages?: number } | undefined;
  return {
    students,
    total: meta?.total ?? students.length,
    page: meta?.page ?? (params?.page || 1),
    limit: meta?.limit ?? (params?.limit || 10),
    totalPages: meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? students.length) / (params?.limit || 10))),
  };
}

export async function getStudentStatsApi(): Promise<StudentStats> {
  const response = await apiClient.get<ApiResponse<StudentStats>>('/students/stats');
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch student statistics');
  }
  return response.data.data;
}

export async function createStudentApi(payload: CreateStudentPayload): Promise<StudentRecord> {
  const response = await apiClient.post<ApiResponse<StudentRecord>>('/students', payload);
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create student account');
  }
  return response.data.data;
}

export async function updateStudentStatusApi(id: string, isActive: boolean): Promise<StudentRecord> {
  const response = await apiClient.patch<ApiResponse<StudentRecord>>(`/students/${id}/status`, {
    is_active: isActive,
  });
  if (!response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update student status');
  }
  return response.data.data;
}
