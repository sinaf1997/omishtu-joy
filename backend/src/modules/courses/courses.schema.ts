import { z } from 'zod';

/**
 * Parses time string (HH:mm or HH:mm:ss) into total minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

export const scheduleSlotSchema = z
  .object({
    day_of_week: z
      .number({ required_error: 'Day of week is required' })
      .int()
      .min(1, 'Day of week must be between 1 (Monday) and 7 (Sunday)')
      .max(7, 'Day of week must be between 1 (Monday) and 7 (Sunday)'),
    start_time: z
      .string({ required_error: 'Start time is required' })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Start time must be formatted as HH:mm'),
    end_time: z
      .string({ required_error: 'End time is required' })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'End time must be formatted as HH:mm'),
    room: z.string().max(100, 'Room name cannot exceed 100 characters').nullable().optional(),
  })
  .strict()
  .refine(
    (slot) => {
      const startMins = timeStringToMinutes(slot.start_time);
      const endMins = timeStringToMinutes(slot.end_time);
      return endMins > startMins;
    },
    {
      message: 'Slot end time must be after start time',
      path: ['end_time'],
    }
  )
  .refine(
    (slot) => {
      const startMins = timeStringToMinutes(slot.start_time);
      const endMins = timeStringToMinutes(slot.end_time);
      return endMins - startMins >= 30;
    },
    {
      message: 'Each time slot must be at least 30 minutes in duration',
      path: ['end_time'],
    }
  );

/**
 * Validates that an array of slots has no internal overlaps on the same day.
 */
function validateNoInternalOverlaps(
  slots: z.infer<typeof scheduleSlotSchema>[]
): boolean {
  const dayBuckets = new Map<number, { startMins: number; endMins: number }[]>();

  for (const slot of slots) {
    const list = dayBuckets.get(slot.day_of_week) ?? [];
    list.push({
      startMins: timeStringToMinutes(slot.start_time),
      endMins: timeStringToMinutes(slot.end_time),
    });
    dayBuckets.set(slot.day_of_week, list);
  }

  for (const [, times] of dayBuckets) {
    times.sort((a, b) => a.startMins - b.startMins);
    for (let i = 1; i < times.length; i++) {
      if (times[i].startMins < times[i - 1].endMins) {
        return false;
      }
    }
  }

  return true;
}

export const createCourseSchema = z
  .object({
    code: z
      .string({ required_error: 'Course code is required' })
      .trim()
      .min(3, 'Course code must be between 3 and 30 characters')
      .max(30, 'Course code must be between 3 and 30 characters')
      .regex(/^[A-Za-z0-9-]+$/, 'Course code may only contain letters, numbers, and hyphens')
      .transform((val) => val.toUpperCase()),
    title: z
      .string({ required_error: 'Course title is required' })
      .trim()
      .min(3, 'Course title must be between 3 and 200 characters')
      .max(200, 'Course title cannot exceed 200 characters'),
    description: z.string().trim().nullable().optional(),
    course_type: z.enum(['major', 'elective'], {
      required_error: 'Course type is required (major or elective)',
    }),
    duration_weeks: z
      .number()
      .int()
      .min(1, 'Duration must be at least 1 week')
      .max(104, 'Duration cannot exceed 104 weeks')
      .nullable()
      .optional(),
    start_date: z
      .string({ required_error: 'Start date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    end_date: z
      .string({ required_error: 'End date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    capacity: z
      .number({ required_error: 'Capacity is required' })
      .int('Capacity must be an integer')
      .min(1, 'Capacity must be at least 1')
      .max(500, 'Capacity cannot exceed 500 students'),
    trainer_id: z.string().trim().nullable().optional(),
    location: z.string().trim().max(100, 'Location cannot exceed 100 characters').nullable().optional(),
    slots: z
      .array(scheduleSlotSchema)
      .min(1, 'A course must have at least one weekly timetable slot'),
  })
  .strict()
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  })
  .refine((data) => validateNoInternalOverlaps(data.slots), {
    message: 'Overlapping time slots detected for the same day inside this course',
    path: ['slots'],
  });

export const updateCourseSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Course code must be between 3 and 30 characters')
      .max(30, 'Course code must be between 3 and 30 characters')
      .regex(/^[A-Za-z0-9-]+$/, 'Course code may only contain letters, numbers, and hyphens')
      .transform((val) => val.toUpperCase())
      .optional(),
    title: z
      .string()
      .trim()
      .min(3, 'Course title must be between 3 and 200 characters')
      .max(200, 'Course title cannot exceed 200 characters')
      .optional(),
    description: z.string().trim().nullable().optional(),
    course_type: z.enum(['major', 'elective']).optional(),
    duration_weeks: z
      .number()
      .int()
      .min(1, 'Duration must be at least 1 week')
      .max(104, 'Duration cannot exceed 104 weeks')
      .nullable()
      .optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
    capacity: z
      .number()
      .int('Capacity must be an integer')
      .min(1, 'Capacity must be at least 1')
      .max(500, 'Capacity cannot exceed 500 students')
      .optional(),
    trainer_id: z.string().trim().nullable().optional(),
    location: z.string().trim().max(100, 'Location cannot exceed 100 characters').nullable().optional(),
    slots: z
      .array(scheduleSlotSchema)
      .min(1, 'A course must have at least one weekly timetable slot')
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.slots) {
        return validateNoInternalOverlaps(data.slots);
      }
      return true;
    },
    {
      message: 'Overlapping time slots detected for the same day inside this course',
      path: ['slots'],
    }
  );

export const updateCourseStatusSchema = z
  .object({
    status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled'], {
      required_error: 'Status is required',
    }),
  })
  .strict();

export const courseFilterSchema = z
  .object({
    search: z.string().optional(),
    course_type: z.enum(['major', 'elective']).optional(),
    status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled']).optional(),
    trainer_id: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();
