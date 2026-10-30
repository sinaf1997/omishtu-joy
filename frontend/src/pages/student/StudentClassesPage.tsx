import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getStudentEnrollmentsOverviewApi,
  cancelElectiveRequestApi,
} from '../../api/student.js';
import {
  StudentEnrollmentsOverview,
  StudentActiveEnrollment,
  StudentPendingRequest,
  StudentDecisionHistoryItem,
} from '../../types/enrollments.js';
import { CourseTypeBadge } from '../../components/academics/CourseTypeBadge.js';
import { Card, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  BookOpen,
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  Loader2,
  Compass,
  History,
  Trash2,
} from 'lucide-react';

type TabKey = 'active' | 'requests' | 'history';

export const StudentClassesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'active';
  const [activeTab, setActiveTab] = useState<TabKey>(
    ['active', 'requests', 'history'].includes(initialTab) ? initialTab : 'active'
  );

  const [data, setData] = useState<StudentEnrollmentsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await getStudentEnrollmentsOverviewApi();
      setData(overview);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load enrollment records');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep tab in URL sync
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(tab === 'active' ? {} : { tab });
  };

  const handleCancelRequest = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to cancel this elective request?')) {
      return;
    }
    try {
      setCancellingId(courseId);
      await cancelElectiveRequestApi(courseId);
      setActionSuccess('Elective request cancelled successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel request';
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const activeCount = data?.active_enrollments.length || 0;
  const requestsCount = data?.pending_requests.length || 0;
  const historyCount = data?.history.length || 0;

  const formatDate = (isoStr: string | null | undefined) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Classes & Enrollments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Active course enrollments, pending elective requests, and your historical academic records.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/student/courses">
            <Compass className="h-4 w-4 text-primary" />
            <span>Browse Catalog</span>
          </Link>
        </Button>
      </div>

      {/* Action Success / Error Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Active Courses</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'active'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Hourglass className="h-3.5 w-3.5" />
          <span>Pending Requests</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'requests'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {requestsCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>History</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'history'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {historyCount}
          </span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : activeTab === 'active' ? (
        // ACTIVE ENROLLMENTS TAB
        <div>
          {data?.active_enrollments && data.active_enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.active_enrollments.map((enr: StudentActiveEnrollment) => (
                <Card
                  key={enr.enrollment_id}
                  className="border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-primary">
                            {enr.course_code}
                          </span>
                          <CourseTypeBadge type={enr.course_type} />
                        </div>
                        <h3 className="font-bold text-base text-foreground leading-snug">
                          {enr.course_title}
                        </h3>
                      </div>
                      <Badge variant="default" className="text-xs font-semibold shrink-0 capitalize">
                        {enr.status}
                      </Badge>
                    </div>

                    {/* Instructor & Dates */}
                    <div className="space-y-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          Instructor:{' '}
                          <span className="font-semibold text-foreground">
                            {enr.trainer_name || 'TBA'}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          Cohort:{' '}
                          <span className="font-semibold text-foreground font-mono">
                            {enr.start_date}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-foreground font-mono">
                            {enr.end_date}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Schedule Slots */}
                    <div className="p-3 rounded-lg bg-secondary/40 border border-border text-xs flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Timetable
                        </p>
                        <p className="font-medium text-foreground">
                          {enr.slot_summary || 'No scheduled slots assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Enrolled on: {formatDate(enr.enrolled_at)}</span>
                      <span className="capitalize">Source: {enr.source.replace('_', ' ')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No active course enrollments"
              description="You are not currently enrolled in any active courses. You can browse available electives in the course catalog or contact administration for major course enrollment."
            />
          )}
        </div>
      ) : activeTab === 'requests' ? (
        // PENDING REQUESTS TAB
        <div>
          {data?.pending_requests && data.pending_requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.pending_requests.map((req: StudentPendingRequest) => (
                <Card
                  key={req.waitlist_id}
                  className="border-border bg-card flex flex-col justify-between hover:border-warning/40 transition-all shadow-sm"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-primary">
                            {req.course_code}
                          </span>
                          <CourseTypeBadge type={req.course_type} />
                        </div>
                        <h3 className="font-bold text-base text-foreground leading-snug">
                          {req.course_title}
                        </h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-warning/10 text-warning border-warning/30 text-xs font-semibold shrink-0"
                      >
                        Queue #{req.position}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Your request is pending staff review. Staff will approve or reject based on seat capacity.
                    </p>

                    {/* Instructor & Dates */}
                    <div className="space-y-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          Instructor:{' '}
                          <span className="font-semibold text-foreground">
                            {req.trainer_name || 'TBA'}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          Cohort:{' '}
                          <span className="font-semibold text-foreground font-mono">
                            {req.start_date}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-foreground font-mono">
                            {req.end_date}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Schedule Slots */}
                    <div className="p-3 rounded-lg bg-secondary/40 border border-border text-xs flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Timetable
                        </p>
                        <p className="font-medium text-foreground">
                          {req.slot_summary || 'No scheduled slots assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Footer with Request Date and Cancel button */}
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px]">
                        Requested: {formatDate(req.requested_at)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(req.course_id)}
                        disabled={cancellingId === req.course_id}
                        className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8 gap-1.5"
                      >
                        {cancellingId === req.course_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span>Cancel Request</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Hourglass}
              title="No pending elective requests"
              description="You do not have any pending elective requests waiting for staff review. Explore open electives in the catalog to submit a request."
            />
          )}
        </div>
      ) : (
        // HISTORY TAB
        <div>
          {data?.history && data.history.length > 0 ? (
            <div className="space-y-3">
              {data.history.map((item: StudentDecisionHistoryItem) => {
                const isApproved = item.status === 'promoted';
                const isRejected = item.status === 'removed';
                const isDropped = item.status === 'dropped';
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-primary">
                          {item.course_code}
                        </span>
                        <CourseTypeBadge type={item.course_type} />
                        <span className="text-xs text-muted-foreground">
                          &bull; {item.record_type === 'enrollment' ? 'Enrollment' : 'Waitlist Request'}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm truncate">
                        {item.course_title}
                      </h4>
                      {item.trainer_name && (
                        <p className="text-xs text-muted-foreground">
                          Instructor: {item.trainer_name}
                        </p>
                      )}
                      {item.reason && (
                        <p className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded inline-block mt-1">
                          Reason: {item.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {isApproved && (
                          <Badge className="bg-success/10 text-success border-success/30 gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Approved & Enrolled</span>
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1 text-xs">
                            <XCircle className="h-3 w-3" />
                            <span>Rejected</span>
                          </Badge>
                        )}
                        {isDropped && (
                          <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            <span>Dropped</span>
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-primary/10 text-primary border-primary/30 gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completed</span>
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {item.resolved_at ? `Resolved on ${formatDate(item.resolved_at)}` : `Requested ${formatDate(item.created_at)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No past academic records"
              description="You do not have any completed, dropped, or resolved enrollment history."
            />
          )}
        </div>
      )}
    </div>
  );
};