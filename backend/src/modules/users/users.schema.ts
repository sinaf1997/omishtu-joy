import { z } from 'zod';

export const staffRoles = [
  'owner',
  'receptionist',
  'academic_admin',
  'trainer',
  'accountant',
  'manager',
] as const;

export const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').max(150),
  email: z.string().email('Please provide a valid email address'),
  role: z.enum(staffRoles, {
    errorMap: () => ({ message: 'Invalid staff role specified' }),
  }),
});

export const updateStaffRoleSchema = z.object({
  role: z.enum(staffRoles, {
    errorMap: () => ({ message: 'Invalid staff role specified' }),
  }),
});

export const updateStaffStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'isActive boolean flag is required',
  }),
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1, 'User ID parameter is required'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
