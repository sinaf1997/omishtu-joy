import { z } from 'zod';

export const staffLoginSchema = z.object({
  email: z.string().email('Please provide a valid staff email address'),
  password: z.string().min(1, 'Password is required'),
});

export const studentLoginSchema = z.object({
  studentCode: z.string().min(1, 'Student ID number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
