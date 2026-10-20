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

export const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').max(150),
  email: z.string().email('Please provide a valid email address'),
  role: z.enum(assignableStaffRoles, {
    errorMap: () => ({ message: 'Role must be one of: receptionist, academic_admin, trainer, accountant, manager' }),
  }),
}).strict();

export const updateStaffSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters long').max(150).optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').max(150).optional(),
  role: z.string().optional(),
  role_id: z.string().optional(),
  roleId: z.string().optional(),
  is_active: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict().refine(
  (data) =>
    data.full_name !== undefined ||
    data.fullName !== undefined ||
    data.role !== undefined ||
    data.role_id !== undefined ||
    data.roleId !== undefined ||
    data.is_active !== undefined ||
    data.isActive !== undefined,
  { message: 'At least one field (full_name, role, is_active) must be provided for update' }
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
