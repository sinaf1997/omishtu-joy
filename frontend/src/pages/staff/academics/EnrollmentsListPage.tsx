import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import {
  listEnrollmentsApi,
  getWaitlistSummaryApi,
} from '../../../api/enrollments.js';
import {
  EnrollmentListItem,
  WaitlistSummaryCourse,
  EnrollmentStatus,
} from '../../../types/enrollments.js';
import { CourseTypeBadge } from '../../../components/academics/CourseTypeBadge.js';
import { EnrollmentStatusBadge } from '../../../components/academics/EnrollmentStatusBadge.js';
import { EnrollmentSourceBadge } from '../../../components/academics/EnrollmentSourceBadge.js';
import { EnrollStudentModal } from '../../../components/academics/EnrollStudentModal.js';
import { DropEnrollmentModal } from '../../../components/academics/DropEnrollmentModal.js';
import {
  UserCheck,
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const EnrollmentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const canManage =
    user?.role === 'owner' ||
    user?.role === 'manager' ||
    user?.role === 'academic_admin' ||
    user?.role === 'receptionist';

  // Tabs: 'enrollments' | 'waitlists'
  const activeTab = (searchParams.get('tab') as 'enrollments' | 'waitlists') || 'enrollments';

  // Enrollments filter & pagination state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | ''>(
    (searchParams.get('status') as EnrollmentStatus) || ''
  );
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Waitlists state
  const [waitlistSummary, setWaitlistSummary] = useState<WaitlistSummaryCourse[]>([]);
  const [loadingWaitlists, setLoadingWaitlists] = useState(false);
  const [waitlistFilter, setWaitlistFilter] = useState<'all' | 'requests' | 'full'>('all');

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; studentName: string; courseTitle: string } | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setLoadingEnrollments(true);
    try {
      const res = await listEnrollmentsApi({
        search: searchTerm.trim() || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setEnrollments(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load enrollments:', err);
    } finally {
      setLoadingEnrollments(false);
    }
  }, [searchTerm, statusFilter, page]);

  const fetchWaitlists = useCallback(async () => {
    setLoadingWaitlists(true);
    try {
      const data = await getWaitlistSummaryApi();
      setWaitlistSummary(data);
    } catch (err) {
      console.error('Failed to load waitlist summary:', err);
    } finally {
      setLoadingWaitlists(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'enrollments') {
      fetchEnrollments();
    } else {
      fetchWaitlists();
    }
  }, [activeTab, fetchEnrollments, fetchWaitlists]);

  const handleTabChange = (tab: 'enrollments' | 'waitlists') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEnrollments();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Enrollments & Course Waitlists
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage student course placements, prerequisite validations, and waitlist queues.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Enroll Student
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6" aria-label="Enrollment Views">
          <button
            onClick={() => handleTabChange('enrollments')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'enrollments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            All Enrollments
          </button>

          <button
            onClick={() => handleTabChange('waitlists')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'waitlists'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Course Waitlists
            {waitlistSummary.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-warning/20 text-warning font-semibold">
                {waitlistSummary.reduce((acc, c) => acc + c.waiting_count, 0)}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* TAB 1: Enrollments Directory */}
      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, code, or course..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as EnrollmentStatus | '');
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {loadingEnrollments ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Loading enrollments...</span>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <UserCheck className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No enrollments found</p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search criteria or enroll a new student.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Enrolled Date</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Status</th>
                      {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/staff/reception/students/${item.student_id}`)}
                            className="text-left group"
                          >
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              {item.student_name}
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="font-mono text-muted-foreground text-[11px]">{item.student_code}</p>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/staff/academics/courses/${item.course_id}`)}
                            className="text-left group"
                          >
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              <span>[{item.course_code}] {item.course_title}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <CourseTypeBadge type={item.course_type} />
                        </td>

                        <td className="py-3 px-4 text-muted-foreground">
                          {item.enrolled_at ? item.enrolled_at.substring(0, 10) : '—'}
                        </td>

                        <td className="py-3 px-4">
                          <EnrollmentSourceBadge source={item.source} />
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <EnrollmentStatusBadge status={item.status} />
                            {item.status === 'dropped' && item.drop_reason && (
                              <p className="text-[10px] text-muted-foreground italic truncate max-w-xs" title={item.drop_reason}>
                                Reason: {item.drop_reason}
                              </p>
                            )}
                          </div>
                        </td>

                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            {item.status === 'active' && (
                              <button
                                onClick={() =>
                                  setDropTarget({
                                    id: item.id,
                                    studentName: item.student_name,
                                    courseTitle: `[${item.course_code}] ${item.course_title}`,
                                  })
                                }
                                className="text-xs font-medium text-destructive hover:underline"
                              >
                                Drop
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing Page {page} of {totalPages} ({totalItems} records)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Course Waitlists Summary */}
      {activeTab === 'waitlists' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Courses with students currently queued in waitlists or elective review queues.
            </p>

            {/* Source Filter */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs self-start">
              <button
                type="button"
                onClick={() => setWaitlistFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  waitlistFilter === 'all'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Waitlists
              </button>
              <button
                type="button"
                onClick={() => setWaitlistFilter('requests')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  waitlistFilter === 'requests'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                With Student Requests
              </button>
              <button
                type="button"
                onClick={() => setWaitlistFilter('full')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  waitlistFilter === 'full'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Capacity Full
              </button>
            </div>
          </div>

          {loadingWaitlists ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading waitlist summary...</span>
            </div>
          ) : waitlistSummary.length === 0 ? (
            <div className="p-12 rounded-xl border border-dashed border-border text-center space-y-2 bg-card">
              <ListOrdered className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Active Waitlists</p>
              <p className="text-xs text-muted-foreground">
                All course seats are currently unconstrained or courses have zero queued students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitlistSummary
                .filter((course) => {
                  if (waitlistFilter === 'requests') {
                    return (course.pending_student_requests || 0) > 0;
                  }
                  if (waitlistFilter === 'full') {
                    return course.enrolled_count >= course.capacity;
                  }
                  return true;
                })
                .map((course) => (
                  <div
                    key={course.course_id}
                    className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm text-primary">
                            {course.course_code}
                          </span>
                          <CourseTypeBadge type={course.course_type} />
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {course.course_title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning shrink-0">
                        {course.waiting_count} waiting
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Seat Capacity:</span>
                        <span className="font-semibold text-foreground">
                          {course.enrolled_count} / {course.capacity}
                        </span>
                      </div>

                      <div className="flex justify-between text-muted-foreground">
                        <span>Oldest in Queue:</span>
                        <span className="text-foreground">
                          {course.oldest_waiting_at ? course.oldest_waiting_at.substring(0, 10) : '—'}
                        </span>
                      </div>

                      {(course.pending_student_requests || 0) > 0 && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            <UserCheck className="w-3 h-3" />
                            {course.pending_student_requests} student request{(course.pending_student_requests || 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/staff/academics/courses/${course.course_id}?tab=waitlist`)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                    >
                      <span>Manage Queue & Approve</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Enroll Student Modal */}
      {isEnrollModalOpen && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          onSuccess={() => {
            fetchEnrollments();
            fetchWaitlists();
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
          courseTitle={dropTarget.courseTitle}
          onSuccess={() => {
            fetchEnrollments();
            fetchWaitlists();
          }}
        />
      )}
    </div>
  );
};
