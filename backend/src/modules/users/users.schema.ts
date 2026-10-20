import { z } from 'zod';

export const allStaffRoles = [
  'owner',
  'receptionist',
  'academic_admin',
  'trainer',
  'accountant',
  'manager',
] as const;

// Owner is NOT selectable when creating or assigning staff
export const assignableStaffRoles = [
  'receptionist',
  'academic_admin',
  'trainer',
  'accountant',
  'manager',
] as const;

export function cleanPhoneNumber(val: string): string {
  return val.replace(/[\s-]/g, '');
}

export function isValidPhoneNumber(val: string): boolean {
  if (!/^\+?[0-9\s-]+$/.test(val)) return false;
  const cleaned = cleanPhoneNumber(val);
  const digitsOnly = cleaned.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 20;
}

export const createStaffSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(150, 'Full name cannot exceed 150 characters')
      .optional(),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(150, 'Full name cannot exceed 150 characters')
      .optional(),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: 'Phone must contain 7 to 20 digits (optional leading +, spaces, dashes)',
      })
      .transform((val) => (!val ? null : cleanPhoneNumber(val.trim()))),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    role: z.enum(assignableStaffRoles, {
      errorMap: () => ({
        message: 'Role must be one of: receptionist, academic_admin, trainer, accountant, manager',
      }),
    }),
  })
  .strict()
  .refine((data) => data.full_name !== undefined || data.fullName !== undefined, {
    message: 'Full name is required',
    path: ['full_name'],
  });

export const updateStaffSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(150, 'Full name cannot exceed 150 characters')
      .optional(),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(150, 'Full name cannot exceed 150 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: 'Phone must contain 7 to 20 digits (optional leading +, spaces, dashes)',
      })
      .transform((val) => (!val ? null : cleanPhoneNumber(val.trim())))
      .optional(),
    role: z.string().optional(),
    role_id: z.string().optional(),
    roleId: z.string().optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.full_name !== undefined ||
      data.fullName !== undefined ||
      data.phone !== undefined ||
      data.role !== undefined ||
      data.role_id !== undefined ||
      data.roleId !== undefined ||
      data.is_active !== undefined ||
      data.isActive !== undefined,
    { message: 'At least one field must be provided for update' }
  );

export const userIdParamsSchema = z.object({
  id: z.string().min(1, 'Staff ID parameter is required'),
});

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
