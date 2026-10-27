import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';
import {
  EnrollmentCheckResult,
  EnrollmentRecord,
  WaitlistRecord,
  CourseRoster,
  StudentEnrollmentItem,
  StudentWaitlistItem,
  EnrollmentListItem,
  WaitlistSummaryCourse,
  ListEnrollmentsFilter,
} from '../types/enrollments.js';

export async function checkEnrollmentEligibilityApi(
  studentId: string,
  courseId: string
): Promise<EnrollmentCheckResult> {
  const response = await apiClient.post<ApiResponse<EnrollmentCheckResult>>('/enrollments/check', {
    student_id: studentId,
    course_id: courseId,
  });
  return response.data.data!;
}

export async function enrollStudentApi(payload: {
  student_id: string;
  course_id: string;
  join_waitlist_if_full?: boolean;
}): Promise<
  | { type: 'enrolled'; enrollment: EnrollmentRecord }
  | { type: 'waitlisted'; waitlist_entry: WaitlistRecord; position: number }
> {
  const response = await apiClient.post<
    ApiResponse<
      | { type: 'enrolled'; enrollment: EnrollmentRecord }
      | { type: 'waitlisted'; waitlist_entry: WaitlistRecord; position: number }
    >
  >('/enrollments', payload);
  return response.data.data!;
}

export async function dropEnrollmentApi(id: string, reason: string): Promise<EnrollmentRecord> {
  const response = await apiClient.patch<ApiResponse<{ enrollment: EnrollmentRecord }>>(
    `/enrollments/${id}/drop`,
    { reason }
  );
  return response.data.data!.enrollment;
}

export async function getCourseRosterApi(courseId: string): Promise<CourseRoster> {
  const response = await apiClient.get<ApiResponse<CourseRoster>>(`/courses/${courseId}/roster`);
  return response.data.data!;
}

export async function promoteWaitlistEntryApi(
  waitlistEntryId: string
): Promise<{ enrollment: EnrollmentRecord; waitlist_entry: WaitlistRecord }> {
  const response = await apiClient.post<
    ApiResponse<{ enrollment: EnrollmentRecord; waitlist_entry: WaitlistRecord }>
  >(`/waitlist/${waitlistEntryId}/promote`);
  return response.data.data!;
}

export async function promoteNextWaitlistEntryApi(
  courseId: string
): Promise<{ enrollment: EnrollmentRecord; waitlist_entry: WaitlistRecord }> {
  const response = await apiClient.post<
    ApiResponse<{ enrollment: EnrollmentRecord; waitlist_entry: WaitlistRecord }>
  >(`/courses/${courseId}/waitlist/promote-next`);
  return response.data.data!;
}

export async function removeWaitlistEntryApi(
  waitlistEntryId: string,
  reason?: string
): Promise<WaitlistRecord> {
  const response = await apiClient.patch<ApiResponse<{ waitlist_entry: WaitlistRecord }>>(
    `/waitlist/${waitlistEntryId}/remove`,
    { reason }
  );
  return response.data.data!.waitlist_entry;
}

export async function getStudentEnrollmentsApi(studentId: string): Promise<{
  enrollments: StudentEnrollmentItem[];
  waitlist: StudentWaitlistItem[];
}> {
  const response = await apiClient.get<
    ApiResponse<{
      enrollments: StudentEnrollmentItem[];
      waitlist: StudentWaitlistItem[];
    }>
  >(`/students/${studentId}/enrollments`);
  return response.data.data!;
}

export interface ListEnrollmentsResponse {
  items: EnrollmentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listEnrollmentsApi(
  params?: ListEnrollmentsFilter
): Promise<ListEnrollmentsResponse> {
  const response = await apiClient.get<
    ApiResponse<EnrollmentListItem[]> & {
      pagination: { total: number; page: number; limit: number; total_pages: number };
    }
  >('/enrollments', { params });

  return {
    items: response.data.data || [],
    total: response.data.pagination?.total || 0,
    page: response.data.pagination?.page || 1,
    limit: response.data.pagination?.limit || 10,
    totalPages: response.data.pagination?.total_pages || 1,
  };
}

export async function getWaitlistSummaryApi(): Promise<WaitlistSummaryCourse[]> {
  const response = await apiClient.get<ApiResponse<WaitlistSummaryCourse[]>>(
    '/enrollments/waitlist-summary'
  );
  return response.data.data!;
}
