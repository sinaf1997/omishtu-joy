import React, { useState, useEffect } from 'react';
import { listStudentsApi } from '../../api/students.js';
import { listCoursesApi } from '../../api/courses.js';
import {
  checkEnrollmentEligibilityApi,
  enrollStudentApi,
} from '../../api/enrollments.js';
import { StudentRecord } from '../../types/students.js';
import { Course } from '../../types/courses.js';
import { EnrollmentCheckResult } from '../../types/enrollments.js';
import { CourseTypeBadge } from './CourseTypeBadge.js';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  UserCheck,
  X,
} from 'lucide-react';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialStudentName?: string;
  initialCourseId?: string;
  initialCourseTitle?: string;
  onSuccess: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  initialStudentName,
  initialCourseId,
  initialCourseTitle,
  onSuccess,
}) => {
  const [studentId, setStudentId] = useState<string>(initialStudentId || '');
  const [courseId, setCourseId] = useState<string>(initialCourseId || '');

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState(initialStudentName || '');

  // Courses state
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState(initialCourseTitle || '');

  // Eligibility check state
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<EnrollmentCheckResult | null>(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStudentId(initialStudentId || '');
      setSelectedStudentName(initialStudentName || '');
      setCourseId(initialCourseId || '');
      setSelectedCourseTitle(initialCourseTitle || '');
      setCheckResult(null);
      setSubmitError(null);

      // Load open courses
      setLoadingCourses(true);
      listCoursesApi({ status: 'open', limit: 100 })
        .then((res) => {
          setCoursesList(res.courses || []);
        })
        .catch(() => {})
        .finally(() => setLoadingCourses(false));
    }
  }, [isOpen, initialStudentId, initialStudentName, initialCourseId, initialCourseTitle]);

  // Search students when search query changes (if no initialStudentId)
  useEffect(() => {
    if (!initialStudentId && isOpen && studentSearch.trim().length >= 2) {
      setSearchingStudents(true);
      const timer = setTimeout(() => {
        listStudentsApi({ search: studentSearch.trim(), limit: 10 })
          .then((res) => {
            setStudentsList(res.students || []);
          })
          .catch(() => {})
          .finally(() => setSearchingStudents(false));
      }, 300);
      return () => clearTimeout(timer);
    } else if (studentSearch.trim().length === 0) {
      setStudentsList([]);
    }
  }, [studentSearch, initialStudentId, isOpen]);

  // Check eligibility whenever both student and course are selected
  useEffect(() => {
    if (studentId && courseId) {
      setChecking(true);
      setCheckResult(null);
      setSubmitError(null);

      checkEnrollmentEligibilityApi(studentId, courseId)
        .then((result) => {
          setCheckResult(result);
        })
        .catch((err: any) => {
          setSubmitError(
            err?.response?.data?.error?.message ||
            err?.message ||
            'Failed to check enrollment eligibility'
          );
        })
        .finally(() => setChecking(false));
    } else {
      setCheckResult(null);
    }
  }, [studentId, courseId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !courseId || !checkResult || checkResult.outcome === 'blocked') {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await enrollStudentApi({
        student_id: studentId,
        course_id: courseId,
        join_waitlist_if_full: checkResult.outcome === 'waitlist',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Enrollment request failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl text-card-foreground my-8">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 id="enroll-modal-title" className="text-lg font-semibold text-foreground">
            Enroll Student in Course
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select student and course to perform automated prerequisite and timetable clash checks.
        </p>

        {submitError && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Student <span className="text-destructive">*</span>
            </label>
            {initialStudentId ? (
              <div className="p-3 rounded-lg border border-border bg-muted/40 text-sm flex justify-between items-center">
                <span className="font-medium text-foreground">{selectedStudentName || initialStudentName}</span>
                <span className="text-xs text-muted-foreground">Pre-selected</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      if (studentId) {
                        setStudentId('');
                        setSelectedStudentName('');
                      }
                    }}
                    placeholder="Search student by name or code (e.g. otc/00001/26)..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {searchingStudents && (
                    <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {selectedStudentName && (
                  <div className="flex items-center justify-between p-2 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary">
                    <span className="font-medium">Selected: {selectedStudentName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentId('');
                        setSelectedStudentName('');
                      }}
                      className="text-primary hover:underline ml-2"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {!studentId && studentsList.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-popover shadow-sm divide-y divide-border">
                    {studentsList.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStudentId(s.id);
                          setSelectedStudentName(`${s.first_name} ${s.last_name || ''} (${s.student_code})`);
                          setStudentsList([]);
                        }}
                        className="w-full text-left p-2.5 text-xs hover:bg-muted transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {s.first_name} {s.last_name}
                          </p>
                          <p className="text-muted-foreground">{s.student_code}</p>
                        </div>
                        <span className="text-primary text-xs font-semibold">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course Selector */}
          <div>
            <label htmlFor="enroll-course-select" className="block text-sm font-medium mb-1.5 text-foreground">
              Course <span className="text-destructive">*</span>
            </label>
            {initialCourseId ? (
              <div className="p-3 rounded-lg border border-border bg-muted/40 text-sm flex justify-between items-center">
                <span className="font-medium text-foreground">{selectedCourseTitle || initialCourseTitle}</span>
                <span className="text-xs text-muted-foreground">Pre-selected</span>
              </div>
            ) : (
              <select
                id="enroll-course-select"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  const found = coursesList.find((c) => c.id === e.target.value);
                  setSelectedCourseTitle(found ? `${found.code} - ${found.title}` : '');
                }}
                disabled={loadingCourses}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
              >
                <option value="">-- Choose an open course --</option>
                {coursesList.map((c) => {
                  const seatsLeft = Math.max(0, c.capacity - (c.enrolled_count || 0));
                  return (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title} ({c.course_type.toUpperCase()} • {seatsLeft} seat(s) left)
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Real-time Eligibility Verification Banner */}
          {checking && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Verifying enrollment rules and schedule conflicts...</span>
            </div>
          )}

          {!checking && checkResult && (
            <div className="rounded-lg p-3 text-xs space-y-2 border">
              {checkResult.outcome === 'enroll' && (
                <div className="border-border bg-primary/10 text-primary p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Eligible to Enroll</span>
                  </div>
                  <p className="text-xs text-foreground/80">
                    All prerequisite and timetable checks passed. Seats available: {checkResult.seats_left}.
                  </p>
                </div>
              )}

              {checkResult.outcome === 'waitlist' && (
                <div className="border-warning/30 bg-warning/10 text-warning-foreground p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm text-warning">
                    <Clock className="w-4 h-4" />
                    <span>Course Full • Eligible for Waitlist</span>
                  </div>
                  <p className="text-xs text-foreground/80">
                    Course is currently at capacity. The student will be queued at waitlist position #{checkResult.waitlist_position_if_added}.
                  </p>
                </div>
              )}

              {checkResult.outcome === 'blocked' && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Cannot Enroll Student</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-destructive">
                    {checkResult.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                checking ||
                !studentId ||
                !courseId ||
                !checkResult ||
                checkResult.outcome === 'blocked'
              }
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                checkResult?.outcome === 'waitlist'
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {checkResult?.outcome === 'waitlist' ? 'Join Waitlist' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
