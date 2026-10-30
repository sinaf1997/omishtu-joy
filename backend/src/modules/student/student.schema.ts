import { z } from 'zod';

export const listStudentCoursesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(9),
    search: z.string().trim().optional(),
    course_type: z.enum(['major', 'elective']).optional(),
    type: z.enum(['major', 'elective']).optional(),
    weekday: z.coerce.number().int().min(1).max(7).optional(),
  })
  .strict();

export const courseIdParamSchema = z
  .object({
    courseId: z.string().min(1, 'Course ID is required'),
  })
  .strict();

export const studentScheduleQuerySchema = z
  .object({
    includePending: z
      .preprocess((val) => val === 'true' || val === true || val === '1', z.boolean())
      .optional()
      .default(false),
  })
  .strict();

export type ListStudentCoursesQuery = z.infer<typeof listStudentCoursesQuerySchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type StudentScheduleQuery = z.infer<typeof studentScheduleQuerySchema>;
