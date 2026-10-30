/**
 * Enrollment Rules Configuration
 * Centralized business constraints for student course enrollments and waitlists.
 */

export const MAX_ACTIVE_MAJORS_PER_STUDENT = 1;
export const MAX_ACTIVE_ELECTIVES_PER_STUDENT = 3;
export const MAX_PENDING_ELECTIVE_REQUESTS_PER_STUDENT = 3;
export const MAX_WAITLIST_PER_COURSE = 20;
export const AUTO_PROMOTE_WAITLIST = false;
export const STAFF_CAN_ENROLL_ELECTIVES = false;

export const ENROLLMENT_RULES_HELPER_TEXT =
  'A student can take 1 major course and up to 3 electives at a time.';
