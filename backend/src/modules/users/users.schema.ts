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
});

export const updateStaffSchema = z.object({
  role: z.enum(assignableStaffRoles).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => data.role !== undefined || data.isActive !== undefined,
  { message: 'At least one field (role or isActive) must be provided for update' }
);

export const userIdParamsSchema = z.object({
  id: z.string().min(1, 'Staff ID parameter is required'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
