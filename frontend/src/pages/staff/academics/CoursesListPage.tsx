import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import {
  listCoursesApi,
  getCourseStatsApi,
  listTrainersApi,
  updateCourseStatusApi,
} from '../../../api/courses.js';
import {
  Course,
  CourseStats,
  CourseType,
  CourseStatus,
  TrainerOption,
} from '../../../types/courses.js';
import { CourseTypeBadge } from '../../../components/academics/CourseTypeBadge.js';
import { CourseStatusBadge } from '../../../components/academics/CourseStatusBadge.js';
import { ChangeStatusModal } from '../../../components/academics/ChangeStatusModal.js';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  GraduationCap,
  CalendarCheck,
  Eye,
  Edit2,
  RefreshCw,
  Ban,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const CoursesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Permission check: owner, manager, academic_admin have manage rights
  const canManage =
    user?.role === 'owner' || user?.role === 'manager' || user?.role === 'academic_admin';

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats>({ total: 0, major: 0, elective: 0, open: 0 });
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedCourseForStatus, setSelectedCourseForStatus] = useState<Course | null>(null);
  const [cancellingCourse, setCancellingCourse] = useState<Course | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, statsRes, trainersRes] = await Promise.all([
        listCoursesApi({
          search: search.trim() || undefined,
          course_type: typeFilter !== 'all' ? (typeFilter as CourseType) : undefined,
          status: statusFilter !== 'all' ? (statusFilter as CourseStatus) : undefined,
          trainer_id: trainerFilter !== 'all' ? trainerFilter : undefined,
          page,
          limit: 10,
        }),
        getCourseStatsApi(),
        listTrainersApi(),
      ]);

      setCourses(coursesRes.courses);
      setTotal(coursesRes.total);
      setTotalPages(coursesRes.totalPages);
      setStats(statsRes);
      setTrainers(trainersRes);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to load course catalog';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, trainerFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelCourse = async () => {
    if (!cancellingCourse) return;
    setCancelLoading(true);
    try {
      await updateCourseStatusApi(cancellingCourse.id, 'cancelled');
      setCancellingCourse(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to cancel course');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Courses
          </h1>
          <p className="text-sm text-muted-foreground">
            Course catalog, class timetables, and capacity management.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => navigate('/staff/academics/courses/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add course
          </button>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Courses
            </p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Major Courses
            </p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.major}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Elective Courses
            </p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.elective}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Open For Enrollment
            </p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.open}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code or title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="major">Major Only</option>
              <option value="elective">Elective Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Trainer Filter */}
          <div>
            <select
              value={trainerFilter}
              onChange={(e) => {
                setTrainerFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Trainers</option>
              {trainers.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted/60 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No courses yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No courses found matching the active filters. Click "Add course" to create a new major or elective course.
            </p>
            {canManage && (
              <button
                onClick={() => navigate('/staff/academics/courses/new')}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add course
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Trainer</th>
                  <th className="px-4 py-3 font-semibold">Timetable</th>
                  <th className="px-4 py-3 font-semibold">Capacity</th>
                  <th className="px-4 py-3 font-semibold">Dates</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map((course) => {
                  const capacityPercent = Math.min(
                    100,
                    Math.round((course.enrolled_count / course.capacity) * 100)
                  );

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-muted/30 transition-colors group text-foreground"
                    >
                      {/* Code */}
                      <td className="px-4 py-3.5 font-mono font-semibold text-primary">
                        {course.code}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3.5 font-medium max-w-[200px] truncate">
                        {course.title}
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <CourseTypeBadge type={course.course_type} />
                      </td>

                      {/* Trainer */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {course.trainer_name || (
                          <span className="italic text-muted-foreground/60">Unassigned</span>
                        )}
                      </td>

                      {/* Schedule summary */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">
                        {course.slot_summary}
                      </td>

                      {/* Capacity */}
                      <td className="px-4 py-3.5">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-foreground">
                              {course.enrolled_count} / {course.capacity}
                            </span>
                            <span className="text-muted-foreground">{capacityPercent}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {course.start_date} to {course.end_date}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <CourseStatusBadge status={course.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/staff/academics/courses/${course.id}`)}
                            title="View Course Details"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => navigate(`/staff/academics/courses/${course.id}/edit`)}
                                title="Edit Course"
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {course.status !== 'completed' && course.status !== 'cancelled' && (
                                <button
                                  onClick={() => setSelectedCourseForStatus(course)}
                                  title="Change Status"
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}

                              {course.status !== 'cancelled' && course.status !== 'completed' && (
                                <button
                                  onClick={() => setCancellingCourse(course)}
                                  title="Cancel Course"
                                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && courses.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {courses.length} of {total} courses
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md border border-border hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md border border-border hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      {selectedCourseForStatus && (
        <ChangeStatusModal
          course={selectedCourseForStatus}
          isOpen={Boolean(selectedCourseForStatus)}
          onClose={() => setSelectedCourseForStatus(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Ban className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-semibold text-foreground">Cancel Course</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to cancel{' '}
                <span className="font-semibold text-foreground">{cancellingCourse.code}</span>? This
                cohort will no longer accept classes or new enrollments.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingCourse(null)}
                disabled={cancelLoading}
                className="px-3.5 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelCourse}
                disabled={cancelLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Course'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
