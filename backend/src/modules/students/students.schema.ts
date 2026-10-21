import { z } from 'zod';

const phoneRegex = /^\+?[0-9\s-]+$/;
export const isValidPhone = (val: string): boolean => {
  if (!phoneRegex.test(val)) return false;
  const digitsOnly = val.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 20;
};

export const isValidDateOfBirth = (val: string): boolean => {
  if (!val) return false;
  const dob = new Date(val);
  if (isNaN(dob.getTime())) return false;
  const now = new Date();
  if (dob >= now) return false;
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);
  return dob <= fiveYearsAgo;
};

export const emergencyContactSchema = z
  .object({
    full_name: z.string().trim().max(150).optional(),
    fullName: z.string().trim().max(150).optional(),
    relationship: z.string().trim().min(2, 'Relationship must be between 2 and 50 characters').max(50),
    phone: z.string().trim().refine(isValidPhone, { message: 'Phone must be between 7 and 20 digits' }),
    alternate_phone: z.string().trim().optional().nullable().refine((v) => !v || isValidPhone(v), {
      message: 'Alternate phone must be between 7 and 20 digits',
    }),
    alternatePhone: z.string().trim().optional().nullable().refine((v) => !v || isValidPhone(v), {
      message: 'Alternate phone must be between 7 and 20 digits',
    }),
  })
  .refine((data) => (data.full_name?.trim() || data.fullName?.trim() || '').length >= 2, {
    message: 'Emergency contact name must be at least 2 characters',
    path: ['full_name'],
  });

export const createStudentSchema = z
  .object({
    // Personal details
    first_name: z.string().trim().max(100).optional(),
    firstName: z.string().trim().max(100).optional(),
    last_name: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    gender: z.enum(['male', 'female']).optional(),
    date_of_birth: z
      .string()
      .optional()
      .refine((v) => !v || isValidDateOfBirth(v), {
        message: 'Date of birth must be in the past and student must be at least 5 years old',
      }),
    dateOfBirth: z
      .string()
      .optional()
      .refine((v) => !v || isValidDateOfBirth(v), {
        message: 'Date of birth must be in the past and student must be at least 5 years old',
      }),

    // Contact details
    phone: z.string().trim().optional().refine((v) => !v || isValidPhone(v), {
      message: 'Phone must be between 7 and 20 digits',
    }),
    email: z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable()
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: 'Invalid email address',
      }),
    address: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),

    // Credentials & Portal access
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    confirm_password: z.string().optional(),
    confirmPassword: z.string().optional(),

    // Emergency contacts
    emergency_contacts: z.array(emergencyContactSchema).max(3, 'Maximum 3 emergency contacts allowed').optional(),
    emergencyContacts: z.array(emergencyContactSchema).max(3, 'Maximum 3 emergency contacts allowed').optional(),

    // Soft duplicate warning flag
    allow_duplicate_warning: z.boolean().optional(),
    allowDuplicateWarning: z.boolean().optional(),

    // Legacy/dev student code override
    student_code: z.string().trim().min(3).max(50).optional(),
    studentCode: z.string().trim().min(3).max(50).optional(),
  })
  .refine(
    (data) => {
      const isFullReg = Boolean(data.first_name || data.firstName || data.phone || data.gender || data.date_of_birth || data.dateOfBirth);
      if (isFullReg) {
        const fn = data.first_name || data.firstName;
        const ln = data.last_name || data.lastName;
        const g = data.gender;
        const dob = data.date_of_birth || data.dateOfBirth;
        const p = data.phone;
        const ec = data.emergency_contacts || data.emergencyContacts;
        if (!fn || fn.trim().length < 2) return false;
        if (!ln || ln.trim().length < 2) return false;
        if (!g) return false;
        if (!dob) return false;
        if (!p) return false;
        if (!ec || ec.length === 0) return false;
      }
      return true;
    },
    {
      message: 'First name, last name, gender, date of birth, phone, and at least one emergency contact are required',
      path: ['first_name'],
    }
  )
  .refine(
    (data) => {
      const confirm = data.confirm_password ?? data.confirmPassword;
      if (confirm !== undefined && confirm !== data.password) {
        return false;
      }
      return true;
    },
    {
      message: 'Confirm password must match password',
      path: ['confirm_password'],
    }
  );

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
