import { z } from 'zod';

export const staffLoginSchema = z.object({
  email: z.string().email('Please provide a valid staff email address'),
  password: z.string().min(1, 'Password is required'),
});

export const studentLoginSchema = z.object({
  studentCode: z.string().min(1, 'Student ID number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z
  .object({
    full_name: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(150, 'Full name cannot exceed 150 characters'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password').optional(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: 'New password and confirmation do not match',
      path: ['confirmPassword'],
    }
  );

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
