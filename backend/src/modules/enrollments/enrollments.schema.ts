import { z } from 'zod';

export const checkEnrollmentSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  course_id: z.string().min(1, 'Course ID is required'),
});

export const createEnrollmentSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  course_id: z.string().min(1, 'Course ID is required'),
  join_waitlist_if_full: z.boolean().optional().default(false),
});

export const dropEnrollmentSchema = z.object({
  reason: z.string().trim().min(3, 'Drop reason must be at least 3 characters'),
});

export const removeWaitlistSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters')
    .max(255, 'Rejection reason cannot exceed 255 characters'),
});

export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  student_id: z.string().optional(),
  course_id: z.string().optional(),
  status: z.enum(['active', 'completed', 'dropped', 'cancelled']).optional(),
  search: z.string().optional(),
});

export const rosterQuerySchema = z.object({
  source: z.enum(['student_request', 'course_full']).optional(),
});

export type CheckEnrollmentInput = z.infer<typeof checkEnrollmentSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type DropEnrollmentInput = z.infer<typeof dropEnrollmentSchema>;
export type RemoveWaitlistInput = z.infer<typeof removeWaitlistSchema>;
export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
export type RosterQuery = z.infer<typeof rosterQuerySchema>;
