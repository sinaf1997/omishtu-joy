import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  StudentCourseItem,
  StudentScheduleSlot,
  StudentEnrollmentsOverview,
  WaitlistRecord,
} from '../types/enrollments.js';

export interface StudentCoursesResponse {
  courses: StudentCourseItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listStudentCoursesApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  course_type?: 'major' | 'elective';
  type?: 'major' | 'elective';
  weekday?: number;
}): Promise<StudentCoursesResponse> {
  const response = await apiClient.get<ApiResponse<StudentCoursesResponse>>('/student/courses', {
    params,
  });
  return response.data.data!;
}

export async function getStudentCourseDetailApi(courseId: string): Promise<StudentCourseItem> {
  const response = await apiClient.get<ApiResponse<StudentCourseItem>>(`/student/courses/${courseId}`);
  return response.data.data!;
}

export async function requestElectiveApi(
  courseId: string
): Promise<{ waitlist_entry: WaitlistRecord; position: number }> {
  const response = await apiClient.post<
    ApiResponse<{ waitlist_entry: WaitlistRecord; position: number }>
  >(`/student/electives/${courseId}/request`);
  return response.data.data!;
}

export async function cancelElectiveRequestApi(courseId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(
    `/student/electives/${courseId}/request`
  );
  return response.data.data!;
}

export async function getStudentEnrollmentsOverviewApi(): Promise<StudentEnrollmentsOverview> {
  const response = await apiClient.get<ApiResponse<StudentEnrollmentsOverview>>(
    '/student/enrollments'
  );
  return response.data.data!;
}

export async function getStudentScheduleApi(
  includePending: boolean = false
): Promise<StudentScheduleSlot[]> {
  const response = await apiClient.get<ApiResponse<StudentScheduleSlot[]>>('/student/schedule', {
    params: { includePending },
  });
  return response.data.data!;
}
