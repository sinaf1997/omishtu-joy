import { z } from 'zod';

export const createStudentSchema = z
  .object({
    student_code: z
      .string()
      .trim()
      .min(3, 'Student ID must be at least 3 characters long')
      .max(50, 'Student ID cannot exceed 50 characters')
      .optional(),
    studentCode: z
      .string()
      .trim()
      .min(3, 'Student ID must be at least 3 characters long')
      .max(50, 'Student ID cannot exceed 50 characters')
      .optional(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  })
  .strict()
  .refine((data) => data.student_code !== undefined || data.studentCode !== undefined, {
    message: 'Student ID is required',
    path: ['student_code'],
  });

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
