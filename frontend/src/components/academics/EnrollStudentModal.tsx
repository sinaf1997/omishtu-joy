import React, { useState, useEffect } from 'react';
import { listStudentsApi } from '../../api/students.js';
import {
  listCoursesApi,
  updateCourseStatusApi,
  getCourseByIdApi,
} from '../../api/courses.js';
import {
  checkEnrollmentEligibilityApi,
  enrollStudentApi,
} from '../../api/enrollments.js';
import { StudentRecord } from '../../types/students.js';
import { Course } from '../../types/courses.js';
import { EnrollmentCheckResult } from '../../types/enrollments.js';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
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
  const [openingCourse, setOpeningCourse] = useState(false);

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

      // Load available courses (open and draft, exclude completed and cancelled)
      setLoadingCourses(true);
      listCoursesApi({ limit: 100 })
        .then(async (res) => {
          let list = (res.courses || []).filter(
            (c) => c.status !== 'completed' && c.status !== 'cancelled' && c.course_type === 'major'
          );
          if (initialCourseId && !list.some((c) => c.id === initialCourseId)) {
            try {
              const single = await getCourseByIdApi(initialCourseId);
              if (single) list = [single, ...list];
            } catch {}
          }
          setCoursesList(list);
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

  const selectedCourse = coursesList.find((c) => c.id === courseId);
  const isOnlyDraftBlocked = Boolean(
    checkResult?.outcome === 'blocked' &&
    checkResult.reasons.length === 1 &&
    checkResult.reasons[0].toLowerCase().includes('status: draft')
  );

  const handleOpenCourse = async () => {
    if (!courseId) return;
    setOpeningCourse(true);
    setSubmitError(null);
    try {
      await updateCourseStatusApi(courseId, 'open');
      setCoursesList((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: 'open' } : c))
      );
      if (studentId) {
        setChecking(true);
        const res = await checkEnrollmentEligibilityApi(studentId, courseId);
        setCheckResult(res);
      }
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to open course for enrollment'
      );
    } finally {
      setOpeningCourse(false);
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !courseId || !checkResult) {
      return;
    }

    if (checkResult.outcome === 'blocked' && !isOnlyDraftBlocked) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Auto-open draft course before enrolling
      if (selectedCourse?.status === 'draft' || isOnlyDraftBlocked) {
        await updateCourseStatusApi(courseId, 'open');
        setCoursesList((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, status: 'open' } : c))
        );
      }

      await enrollStudentApi({
        student_id: studentId,
        course_id: courseId,
        join_waitlist_if_full:
          checkResult.outcome === 'waitlist' ||
          (checkResult.seats_left !== undefined && checkResult.seats_left <= 0),
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

  const canSubmit =
    !submitting &&
    !checking &&
    !openingCourse &&
    Boolean(studentId) &&
    Boolean(courseId) &&
    checkResult !== null &&
    (checkResult.outcome !== 'blocked' || isOnlyDraftBlocked);

  let submitButtonLabel = 'Enroll Student';
  if (isOnlyDraftBlocked && checkResult) {
    submitButtonLabel =
      checkResult?.outcome === 'waitlist' ||
      (checkResult?.seats_left !== undefined && checkResult.seats_left <= 0)
        ? 'Open Course & Join Waitlist'
        : 'Open Course & Enroll Student';
  } else if (checkResult?.outcome === 'waitlist') {
    submitButtonLabel = 'Join Waitlist';
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
                <option value="">
                  {loadingCourses ? '-- Loading major courses... --' : '-- Choose an available major course --'}
                </option>
                {coursesList.map((c) => {
                  const seatsLeft = Math.max(0, c.capacity - (c.enrolled_count || 0));
                  const isDraft = c.status === 'draft';
                  return (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title} ({c.course_type.toUpperCase()} • {isDraft ? 'Draft - Not yet opened' : `${seatsLeft} seat(s) left`})
                    </option>
                  );
                })}
              </select>
            )}

            <p className="text-[11px] text-muted-foreground mt-1.5">
              ℹ️ Electives are selected by the student in their portal. Only major courses can be enrolled here.
            </p>

            {selectedCourse?.status === 'draft' && (
              <div className="mt-2.5 p-3 rounded-lg border border-warning/30 bg-warning/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <p className="font-semibold text-warning">Course in Draft Status</p>
                  <p className="text-muted-foreground mt-0.5">
                    This course hasn't been opened yet. You can open it now or it will automatically open when you enroll.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCourse}
                  disabled={openingCourse || submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50 self-start sm:self-auto"
                >
                  {openingCourse ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Open Course Now
                </button>
              </div>
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

              {checkResult.outcome === 'blocked' && isOnlyDraftBlocked && (
                <div className="border border-warning/30 bg-warning/10 text-warning-foreground p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm text-warning">
                    <CheckCircle2 className="w-4 h-4 text-warning" />
                    <span>Prerequisites & Timetable Verified</span>
                  </div>
                  <p className="text-xs text-foreground/80">
                    No schedule clashes found. The course is currently in Draft status and will be opened automatically upon submitting enrollment.
                  </p>
                </div>
              )}

              {checkResult.outcome === 'blocked' && !isOnlyDraftBlocked && (
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
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                checkResult?.outcome === 'waitlist' && !isOnlyDraftBlocked
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {(submitting || openingCourse) && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitButtonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
