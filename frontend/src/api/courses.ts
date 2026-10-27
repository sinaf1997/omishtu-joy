import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  Course,
  CourseStats,
  CourseFilter,
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseStatus,
  TrainerOption,
} from '../types/courses.js';

export interface CoursesListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listCoursesApi(params?: CourseFilter): Promise<CoursesListResponse> {
  const response = await apiClient.get<ApiResponse<CoursesListResponse>>('/courses', { params });
  return response.data.data!;
}

export async function getCourseStatsApi(): Promise<CourseStats> {
  const response = await apiClient.get<ApiResponse<CourseStats>>('/courses/stats');
  return response.data.data!;
}

export async function getCourseByIdApi(id: string): Promise<Course> {
  const response = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
  return response.data.data!;
}

export async function createCourseApi(payload: CreateCoursePayload): Promise<Course> {
  const response = await apiClient.post<ApiResponse<Course>>('/courses', payload);
  return response.data.data!;
}

export async function updateCourseApi(id: string, payload: UpdateCoursePayload): Promise<Course> {
  const response = await apiClient.patch<ApiResponse<Course>>(`/courses/${id}`, payload);
  return response.data.data!;
}

export async function updateCourseStatusApi(id: string, status: CourseStatus): Promise<Course> {
  const response = await apiClient.patch<ApiResponse<Course>>(`/courses/${id}/status`, { status });
  return response.data.data!;
}

export async function listTrainersApi(): Promise<TrainerOption[]> {
  const response = await apiClient.get<ApiResponse<TrainerOption[]>>('/courses/trainers');
  return response.data.data!;
}
