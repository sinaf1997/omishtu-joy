import React, { useState, useEffect, useCallback } from 'react';
import {
  listStudentCoursesApi,
  getStudentCourseDetailApi,
  requestElectiveApi,
  cancelElectiveRequestApi,
} from '../../api/student.js';
import { StudentCourseItem } from '../../types/enrollments.js';
import { CourseTypeBadge } from '../../components/academics/CourseTypeBadge.js';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Compass,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

const WEEKDAYS = [
  { value: 0, label: 'All Weekdays' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export const BrowseCoursesPage: React.FC = () => {
  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState<'all' | 'major' | 'elective'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState<number>(0);
  const [page, setPage] = useState(1);

  // Data State
  const [courses, setCourses] = useState<StudentCourseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<StudentCourseItem | null>(null);
  const [confirmElectiveTarget, setConfirmElectiveTarget] = useState<StudentCourseItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listStudentCoursesApi({
        page,
        limit: 9,
        search: searchTerm.trim() || undefined,
        course_type: activeTab === 'all' ? undefined : activeTab,
        weekday: weekdayFilter > 0 ? weekdayFilter : undefined,
      });
      setCourses(res.courses || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to load open courses. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, activeTab, weekdayFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset page when tab or filters change
  const handleTabChange = (tab: 'all' | 'major' | 'elective') => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleWeekdayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWeekdayFilter(Number(e.target.value));
    setPage(1);
  };

  const handleConfirmRequest = async () => {
    if (!confirmElectiveTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await requestElectiveApi(confirmElectiveTarget.id);
      setActionSuccess(`Request for ${confirmElectiveTarget.code} submitted to the academic office.`);
      setConfirmElectiveTarget(null);
      await fetchCourses();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to submit elective request.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (courseId: string, courseCode: string) => {
    if (!window.confirm(`Are you sure you want to cancel your request for ${courseCode}?`)) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelElectiveRequestApi(courseId);
      setActionSuccess(`Request for ${courseCode} cancelled.`);
      await fetchCourses();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to cancel elective request.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = async (c: StudentCourseItem) => {
    try {
      const full = await getStudentCourseDetailApi(c.id);
      setSelectedDetailCourse(full);
    } catch {
      setSelectedDetailCourse(c);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Browse Available Courses
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore open cohorts, check class schedules, and submit elective requests for academic review.
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/10 text-primary text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="p-1 hover:bg-primary/20 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-destructive/20 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          {(['all', 'major', 'elective'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab === 'all' ? 'All Courses' : `${tab}s`}
            </button>
          ))}
        </div>

        {/* Search & Weekday Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search code or title..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={weekdayFilter}
              onChange={handleWeekdayChange}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {WEEKDAYS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Course List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl border border-border bg-card p-5 animate-pulse space-y-4">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-20 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl border border-destructive/20 bg-destructive/10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button
            onClick={() => fetchCourses()}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border bg-card text-center space-y-3">
          <Compass className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No open courses found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || weekdayFilter > 0 || activeTab !== 'all'
              ? 'No courses match your active search terms and filters. Try resetting filters.'
              : 'There are currently no open course cohorts accepting registrations.'}
          </p>
          {(searchTerm || weekdayFilter > 0 || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setWeekdayFilter(0);
                setActiveTab('all');
                setPage(1);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const isMajor = course.course_type === 'major';
            const isElective = course.course_type === 'elective';
            const isEnrolled = course.my_status === 'enrolled';
            const isRequested = course.my_status === 'requested';
            const isBlocked = course.my_status === 'blocked';

            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div>
                  {/* Top Bar: Code, Type, Status Chip */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">
                        {course.code}
                      </span>
                      <CourseTypeBadge type={course.course_type} />
                    </div>

                    {/* Status Chip */}
                    {isEnrolled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                        Enrolled
                      </span>
                    )}
                    {isRequested && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/20 text-warning border border-warning/30">
                        Requested {course.waitlist_position ? `(#${course.waitlist_position})` : ''}
                      </span>
                    )}
                    {isBlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        Unavailable
                      </span>
                    )}
                    {!isEnrolled && !isRequested && !isBlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                        Not Enrolled
                      </span>
                    )}
                  </div>

                  {/* Title & Trainer */}
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-1 mb-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                    <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{course.trainer_name || 'Unassigned Trainer'}</span>
                  </p>

                  {/* Schedule & Metadata Card */}
                  <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs border border-border/60">
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{course.slot_summary}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {course.start_date.substring(0, 10)} to {course.end_date.substring(0, 10)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50 text-[11px]">
                      <span>Seats Left:</span>
                      <span className="font-semibold text-foreground">
                        {course.seats_left} / {course.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Helper Text for Major Courses */}
                  {isMajor && (
                    <div className="mt-3 p-2.5 rounded-lg bg-secondary/50 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        Major courses are enrolled by the front desk. Visit reception or the academic office.
                      </span>
                    </div>
                  )}

                  {/* Blocking Reasons if Elective Blocked */}
                  {isElective && isBlocked && course.blocking_reasons.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-muted/70 border border-border text-[11px] text-muted-foreground space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-warning" />
                        <span>Cannot Select:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                        {course.blocking_reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-border mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(course)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    View Timetable
                  </button>

                  {/* Action buttons */}
                  {isMajor ? (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Office Enrollment
                    </span>
                  ) : isEnrolled ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Student
                    </span>
                  ) : isRequested ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleCancelRequest(course.id, course.code)}
                      className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      Cancel Request
                    </button>
                  ) : course.can_request ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setConfirmElectiveTarget(course)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                    >
                      Select Elective
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium cursor-not-allowed border border-border"
                    >
                      Cannot Select
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({total} courses)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Elective Selection Dialog */}
      {confirmElectiveTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-elective-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl text-card-foreground">
            <button
              onClick={() => setConfirmElectiveTarget(null)}
              disabled={actionLoading}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 id="confirm-elective-title" className="text-lg font-bold text-foreground">
                  Select Elective Course
                </h3>
                <p className="text-xs text-muted-foreground">
                  Review the schedule before submitting your request.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 my-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-primary">
                  {confirmElectiveTarget.code}
                </span>
                <CourseTypeBadge type={confirmElectiveTarget.course_type} />
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {confirmElectiveTarget.title}
                </h4>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Instructor: {confirmElectiveTarget.trainer_name || 'Unassigned'}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60">
                <p className="font-semibold text-foreground text-xs mb-1.5">Weekly Timetable:</p>
                <div className="space-y-1">
                  {confirmElectiveTarget.weekly_slots.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md bg-card border border-border/60 text-xs"
                    >
                      <span className="font-medium text-foreground">
                        {WEEKDAYS.find((w) => w.value === s.day_of_week)?.label || `Day ${s.day_of_week}`}
                      </span>
                      <span className="text-muted-foreground">
                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                        {s.room ? ` • ${s.room}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-primary/20 bg-primary/10 text-primary text-xs space-y-1 mb-5">
              <p className="font-semibold">Important Academic Notice:</p>
              <p className="text-foreground/80 leading-relaxed text-[11px]">
                Your request will be reviewed by the academic office. You are enrolled once it is approved. If the course is full, you will be placed on the review waitlist.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setConfirmElectiveTarget(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Elective Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Dialog */}
      {selectedDetailCourse && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl text-card-foreground my-8">
            <button
              onClick={() => setSelectedDetailCourse(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono font-bold text-base text-primary">
                {selectedDetailCourse.code}
              </span>
              <CourseTypeBadge type={selectedDetailCourse.course_type} />
            </div>

            <h3 id="course-detail-title" className="text-lg font-bold text-foreground mb-1">
              {selectedDetailCourse.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Lead Trainer: {selectedDetailCourse.trainer_name || 'Unassigned'}
              {selectedDetailCourse.location ? ` • Room/Hall: ${selectedDetailCourse.location}` : ''}
            </p>

            {selectedDetailCourse.description && (
              <div className="mb-4 text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/60">
                {selectedDetailCourse.description}
              </div>
            )}

            <div className="space-y-2 mb-5">
              <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Weekly Class Timetable
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedDetailCourse.weekly_slots.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs"
                  >
                    <span className="font-medium text-foreground">
                      {WEEKDAYS.find((w) => w.value === s.day_of_week)?.label || `Day ${s.day_of_week}`}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      {s.room ? ` (Room: ${s.room})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedDetailCourse(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
