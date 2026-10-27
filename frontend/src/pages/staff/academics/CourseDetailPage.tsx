import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { getCourseByIdApi } from '../../../api/courses.js';
import {
  getCourseRosterApi,
  promoteWaitlistEntryApi,
  promoteNextWaitlistEntryApi,
  removeWaitlistEntryApi,
} from '../../../api/enrollments.js';
import { Course } from '../../../types/courses.js';
import { CourseRoster, RosterEnrolledStudent, RosterWaitlistedStudent } from '../../../types/enrollments.js';
import { CourseTypeBadge } from '../../../components/academics/CourseTypeBadge.js';
import { CourseStatusBadge } from '../../../components/academics/CourseStatusBadge.js';
import { EnrollmentStatusBadge } from '../../../components/academics/EnrollmentStatusBadge.js';
import { EnrollmentSourceBadge } from '../../../components/academics/EnrollmentSourceBadge.js';
import { WeeklyTimetableGrid } from '../../../components/academics/WeeklyTimetableGrid.js';
import { ChangeStatusModal } from '../../../components/academics/ChangeStatusModal.js';
import { EnrollStudentModal } from '../../../components/academics/EnrollStudentModal.js';
import { DropEnrollmentModal } from '../../../components/academics/DropEnrollmentModal.js';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  Edit2,
  RefreshCw,
  AlertCircle,
  Loader2,
  GraduationCap,
  Layers,
  UserCheck,
  UserPlus,
  Trash2,
  ArrowUpRight,
  ListOrdered,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManageCourse =
    user?.role === 'owner' || user?.role === 'manager' || user?.role === 'academic_admin';

  const canManageEnrollments =
    user?.role === 'owner' ||
    user?.role === 'manager' ||
    user?.role === 'academic_admin' ||
    user?.role === 'receptionist';

  const [course, setCourse] = useState<Course | null>(null);
  const [roster, setRoster] = useState<CourseRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tab State: 'overview' | 'enrolled' | 'waitlist'
  const [activeTab, setActiveTab] = useState<'overview' | 'enrolled' | 'waitlist'>('overview');

  // Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; studentName: string } | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCourseByIdApi(id);
      setCourse(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Course not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRoster = useCallback(async () => {
    if (!id) return;
    setRosterLoading(true);
    try {
      const data = await getCourseRosterApi(id);
      setRoster(data);
    } catch (err) {
      console.error('Failed to load course roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
    fetchRoster();
  }, [fetchCourse, fetchRoster]);

  const handlePromoteNext = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await promoteNextWaitlistEntryApi(id);
      await fetchCourse();
      await fetchRoster();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to promote next student from waitlist.'
      );
    }
  };

  const handlePromoteEntry = async (waitlistId: string) => {
    setActionError(null);
    try {
      await promoteWaitlistEntryApi(waitlistId);
      await fetchCourse();
      await fetchRoster();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to promote student.'
      );
    }
  };

  const handleRemoveWaitlist = async (waitlistId: string) => {
    setActionError(null);
    try {
      await removeWaitlistEntryApi(waitlistId, 'Removed by staff request');
      await fetchRoster();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to remove waitlist entry.'
      );
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Course Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || 'Unable to retrieve course details.'}</p>
        <button
          onClick={() => navigate('/staff/academics/courses')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
      </div>
    );
  }

  const enrolledCount = roster?.summary.enrolled_count ?? course.enrolled_count;
  const waitlistCount = roster?.summary.waitlist_count ?? 0;
  const capacityPercent = Math.min(
    100,
    Math.round((enrolledCount / course.capacity) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/academics/courses')}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-xl text-primary">{course.code}</span>
              <CourseTypeBadge type={course.course_type} />
              <CourseStatusBadge status={course.status} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageEnrollments && course.status === 'open' && (
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Enroll Student
            </button>
          )}

          {canManageCourse && (
            <>
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                Change Status
              </button>
              <button
                onClick={() => navigate(`/staff/academics/courses/${course.id}/edit`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Seat Capacity</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">
              {enrolledCount} / {course.capacity}
            </span>
            <span className="text-xs text-muted-foreground">{capacityPercent}% full</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Schedule & Duration */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Duration</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {course.duration_weeks ? `${course.duration_weeks} Weeks` : '—'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{course.slot_summary}</p>
        </div>

        {/* Date Range */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Cohort Period</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs font-semibold text-foreground space-y-0.5">
            <div>Starts: {course.start_date.substring(0, 10)}</div>
            <div>Ends: {course.end_date.substring(0, 10)}</div>
          </div>
        </div>

        {/* Assigned Trainer */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Lead Trainer</span>
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-base font-bold text-foreground truncate">
            {course.trainer_name || 'Unassigned'}
          </p>
          <p className="text-xs text-muted-foreground">
            {course.trainer_name ? 'Active instructor' : 'Pending assignment'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-6" aria-label="Course Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Layers className="w-4 h-4" />
            Overview & Timetable
          </button>

          <button
            onClick={() => setActiveTab('enrolled')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'enrolled'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Enrolled Students
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-muted text-foreground">
              {enrolledCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('waitlist')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'waitlist'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Waitlist
            {waitlistCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-warning/20 text-warning font-semibold">
                {waitlistCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* TAB CONTENT: 1. Overview & Timetable */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Course Information & Description
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="md:col-span-2 space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Description</span>
                <p className="text-foreground leading-relaxed">
                  {course.description || (
                    <span className="italic text-muted-foreground">No description provided.</span>
                  )}
                </p>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    Default Location
                  </span>
                  <span className="text-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {course.location || 'Main Campus'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Curriculum Type</span>
                  <span className="text-foreground font-semibold capitalize">
                    {course.course_type} Course
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Weekly Class Timetable
            </h3>
            <WeeklyTimetableGrid slots={course.slots} />
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Enrolled Students */}
      {activeTab === 'enrolled' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Active Enrolled Students ({roster?.enrolled.length || 0})
              </h3>
              <p className="text-xs text-muted-foreground">
                Capacity: {enrolledCount} of {course.capacity} filled ({course.capacity - enrolledCount} seats remaining)
              </p>
            </div>

            {canManageEnrollments && course.status === 'open' && (
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors self-start"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Enroll Student
              </button>
            )}
          </div>

          {rosterLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : !roster || roster.enrolled.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-2 bg-card">
              <Users className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No students enrolled yet</p>
              <p className="text-xs text-muted-foreground">
                When students are enrolled, their names, student IDs, and enrollment sources will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Enrolled At</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Status</th>
                      {canManageEnrollments && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roster.enrolled.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/staff/reception/students/${student.student_id}`)}
                            className="text-left group"
                          >
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              {student.full_name}
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">{student.student_code}</p>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          <div>{student.email || '—'}</div>
                          <div>{student.phone || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {student.enrolled_at ? student.enrolled_at.substring(0, 10) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <EnrollmentSourceBadge source={student.source} />
                        </td>
                        <td className="py-3 px-4">
                          <EnrollmentStatusBadge status={student.status} />
                        </td>
                        {canManageEnrollments && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setDropTarget({ id: student.id, studentName: student.full_name })}
                              className="text-xs font-medium text-destructive hover:underline"
                            >
                              Drop
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. Waitlist */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Waitlist Queue ({roster?.waitlist.length || 0})
              </h3>
              <p className="text-xs text-muted-foreground">
                Ordered chronologically by joined date. Capacity status: {enrolledCount} / {course.capacity}.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              {canManageEnrollments && waitlistCount > 0 && enrolledCount < course.capacity && (
                <button
                  onClick={handlePromoteNext}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Promote Next Student
                </button>
              )}
            </div>
          </div>

          {rosterLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : !roster || roster.waitlist.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-2 bg-card">
              <ListOrdered className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">Waitlist is empty</p>
              <p className="text-xs text-muted-foreground">
                When this course reaches full capacity, additional students joining will appear here in queue.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="py-3 px-4">Queue #</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Joined Date</th>
                      {canManageEnrollments && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roster.waitlist.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning/15 text-warning font-bold text-xs">
                            #{entry.position}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/staff/reception/students/${entry.student_id}`)}
                            className="text-left group"
                          >
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              {entry.full_name}
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">{entry.student_code}</p>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          <div>{entry.email || '—'}</div>
                          <div>{entry.phone || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {entry.joined_at ? entry.joined_at.substring(0, 10) : '—'}
                        </td>
                        {canManageEnrollments && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                onClick={() => handlePromoteEntry(entry.id)}
                                disabled={enrolledCount >= course.capacity}
                                title={
                                  enrolledCount >= course.capacity
                                    ? 'Cannot promote: course is full'
                                    : 'Promote student to active enrollment'
                                }
                                className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Promote
                              </button>
                              <button
                                onClick={() => handleRemoveWaitlist(entry.id)}
                                className="text-xs font-medium text-destructive hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <ChangeStatusModal
          course={course}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={() => {
            fetchCourse();
            fetchRoster();
          }}
        />
      )}

      {/* Enroll Student Modal */}
      {isEnrollModalOpen && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          initialCourseId={course.id}
          initialCourseTitle={`[${course.code}] ${course.title}`}
          onSuccess={() => {
            fetchCourse();
            fetchRoster();
          }}
        />
      )}

      {/* Drop Enrollment Modal */}
      {dropTarget && (
        <DropEnrollmentModal
          isOpen={!!dropTarget}
          onClose={() => setDropTarget(null)}
          enrollmentId={dropTarget.id}
          studentName={dropTarget.studentName}
          courseTitle={`[${course.code}] ${course.title}`}
          onSuccess={() => {
            fetchCourse();
            fetchRoster();
          }}
        />
      )}
    </div>
  );
};
