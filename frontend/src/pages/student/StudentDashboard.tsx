import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useStudentDashboard } from '../../hooks/useStudentData.js';
import {
  getStudentEnrollmentsOverviewApi,
  getStudentScheduleApi,
} from '../../api/student.js';
import {
  StudentEnrollmentsOverview,
  StudentScheduleSlot,
} from '../../types/enrollments.js';
import { CourseTypeBadge } from '../../components/academics/CourseTypeBadge.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { Skeleton, CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  Calendar,
  Flame,
  ArrowRight,
  Clock,
  MapPin,
  User,
  Bell,
  IdCard,
  TrendingUp,
  Hourglass,
  Compass,
} from 'lucide-react';

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: mockData, loading: mockLoading } = useStudentDashboard();

  // Real Data State
  const [overview, setOverview] = useState<StudentEnrollmentsOverview | null>(null);
  const [schedule, setSchedule] = useState<StudentScheduleSlot[]>([]);
  const [realLoading, setRealLoading] = useState(true);
  const [realError, setRealError] = useState<string | null>(null);

  const studentName = user?.fullName || user?.full_name || user?.firstName || 'Student';
  const studentCode = user?.studentCode || user?.student_code || 'otc/00001/26';

  useEffect(() => {
    let isMounted = true;
    async function loadRealData() {
      try {
        setRealLoading(true);
        setRealError(null);
        const [overviewRes, scheduleRes] = await Promise.all([
          getStudentEnrollmentsOverviewApi(),
          getStudentScheduleApi(false),
        ]);
        if (isMounted) {
          setOverview(overviewRes);
          setSchedule(scheduleRes);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
          const msg =
            axiosErr?.response?.data?.error?.message ||
            (err instanceof Error ? err.message : 'Failed to load student data');
          setRealError(msg);
        }
      } finally {
        if (isMounted) {
          setRealLoading(false);
        }
      }
    }
    loadRealData();
    return () => {
      isMounted = false;
    };
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatDateISO(today), [today]);
  // JavaScript getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // In our database course_schedule_slots: 1 = Monday ... 7 = Sunday
  const todayDayNumber = useMemo(() => {
    const d = today.getDay();
    return d === 0 ? 7 : d;
  }, [today]);

  // Today's classes derived from real schedule
  const todayClasses = useMemo(() => {
    return schedule
      .filter((s) => {
        if (s.day_of_week !== todayDayNumber) return false;
        return todayIso >= s.start_date && todayIso <= s.end_date;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [schedule, todayDayNumber, todayIso]);

  // Upcoming this week (remaining days of current week)
  const upcomingThisWeek = useMemo(() => {
    return schedule
      .filter((s) => {
        if (s.day_of_week <= todayDayNumber) return false;
        return todayIso >= s.start_date && todayIso <= s.end_date;
      })
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [schedule, todayDayNumber, todayIso]);

  const activeCoursesCount = overview?.active_enrollments.length ?? 0;
  const pendingRequestsCount = overview?.pending_requests.length ?? 0;

  const loading = realLoading || mockLoading;

  return (
    <div className="space-y-6">
      {/* 1. Greeting & Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {studentName}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Student ID: <span className="font-mono font-bold text-primary">{studentCode}</span> &bull; Academic Portal
          </p>
        </div>

        {/* Quick links header buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="text-xs gap-1.5 rounded-full">
            <Link to="/student/membership">
              <IdCard className="h-3.5 w-3.5 text-primary" />
              <span>Student ID Card</span>
            </Link>
          </Button>
          <Button asChild variant="default" size="sm" className="text-xs gap-1.5 rounded-full">
            <Link to="/student/class-plan">
              <Calendar className="h-3.5 w-3.5" />
              <span>My Class Plan</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {realError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{realError}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. 4 Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Real: Active Courses */}
          <Card className="shadow-sm border-border bg-card hover:border-primary/40 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Active Courses
                </p>
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">
                {activeCoursesCount}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">Currently enrolled</span>
                <Link to="/student/classes" className="text-primary font-medium hover:underline">
                  View &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Real: Pending Requests */}
          <Card className="shadow-sm border-border bg-card hover:border-warning/40 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Pending Requests
                </p>
                <div className="h-9 w-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <Hourglass className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">
                {pendingRequestsCount}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">Awaiting staff review</span>
                {pendingRequestsCount > 0 ? (
                  <Link
                    to="/student/classes?tab=requests"
                    className="text-warning font-medium hover:underline"
                  >
                    View queue &rarr;
                  </Link>
                ) : (
                  <Link to="/student/courses" className="text-primary font-medium hover:underline">
                    Catalog &rarr;
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sample: Attendance Rate */}
          <Card className="shadow-sm border-border bg-card hover:border-primary/40 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Attendance Rate
                  </p>
                  <SampleDataBadge />
                </div>
                <div className="h-9 w-9 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">
                {mockData?.stats[1]?.value || '94.2%'}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">Semester average</span>
                <span className="text-success font-medium">+2.1%</span>
              </div>
            </CardContent>
          </Card>

          {/* Sample: Pending Balance */}
          <Card className="shadow-sm border-border bg-card hover:border-primary/40 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Pending Balance
                  </p>
                  <SampleDataBadge />
                </div>
                <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">
                {mockData?.stats[3]?.value || '$0.00'}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted-foreground">Tuition status</span>
                <span className="text-success font-medium">Cleared</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Main Split Grid: Left (Real Classes) / Right (Pending Alert & Streak & Notice) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Classes & Upcoming this week */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Card (Real) */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Today&apos;s Classes
                </CardTitle>
                <CardDescription className="text-xs">
                  Your scheduled training sessions for {DAY_NAMES[todayDayNumber]}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                {todayClasses.length} {todayClasses.length === 1 ? 'Session' : 'Sessions'}
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {realLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : todayClasses.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No classes scheduled today"
                  description="You have no lectures or training sessions today. Check your full class plan for upcoming days."
                />
              ) : (
                todayClasses.map((cls) => (
                  <div
                    key={cls.slot_id}
                    className="p-3.5 rounded-xl border border-border bg-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {cls.course_title}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {cls.course_code}
                        </Badge>
                        <CourseTypeBadge type={cls.course_type} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {cls.start_time} - {cls.end_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {cls.room || 'Room TBA'}
                        </span>
                        {cls.trainer_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-primary" />
                            {cls.trainer_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming this week (Real) */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Upcoming This Week
                </CardTitle>
                <CardDescription className="text-xs">
                  Remaining sessions scheduled across this week
                </CardDescription>
              </div>
              <Link
                to="/student/class-plan"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Full Plan <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {realLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : upcomingThisWeek.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming classes for the rest of this week"
                  description="Check your full curriculum timetable for next week's schedule."
                />
              ) : (
                upcomingThisWeek.map((item) => (
                  <div
                    key={item.slot_id}
                    className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-12 rounded-lg bg-secondary text-center flex flex-col justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground leading-tight">
                          {DAY_NAMES[item.day_of_week].slice(0, 3)}
                        </span>
                        <span className="text-[10px] font-bold text-foreground leading-tight">
                          Day {item.day_of_week}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">{item.course_title}</p>
                          <CourseTypeBadge type={item.course_type} />
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>
                            {item.start_time} - {item.end_time}
                          </span>
                          <span>&bull;</span>
                          <span>{item.room || 'Room TBA'}</span>
                          {item.trainer_name && (
                            <>
                              <span>&bull;</span>
                              <span>{item.trainer_name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Pending Requests Card & Streak & Notice */}
        <div className="space-y-6">
          {/* Pending Elective Requests Summary Card (Real) */}
          {pendingRequestsCount > 0 && (
            <Card className="border-warning/30 bg-warning/5 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
                    <Hourglass className="h-4 w-4" />
                    <span>Pending Elective Requests</span>
                  </div>
                  <Badge variant="secondary" className="bg-warning/20 text-warning font-mono text-xs">
                    {pendingRequestsCount} in queue
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have {pendingRequestsCount} elective course {pendingRequestsCount === 1 ? 'request' : 'requests'} waiting for academic review.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs border-warning/30 hover:bg-warning/10">
                  <Link to="/student/classes?tab=requests">
                    <span>Manage Elective Requests</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Attendance Streak Mini Card (Sample Data) */}
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Attendance Streak
                  </span>
                  <SampleDataBadge />
                </div>
                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Flame className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {mockData?.streak.currentDays ?? 12}
                </span>
                <span className="text-xs text-muted-foreground font-medium">consecutive days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {mockData?.streak.message || 'Great consistency! Keep up your streak to earn academic honors.'}
              </p>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Personal best</span>
                <span className="font-semibold text-foreground">
                  {mockData?.streak.bestDays ?? 15} Days
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Latest Notice Card (Sample Data) */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    Latest Notice
                  </CardTitle>
                  <SampleDataBadge />
                </div>
                <Badge variant="subtle" className="text-[10px]">
                  {mockData?.latestNotice.category || 'Academic'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{mockData?.latestNotice.date || 'Today'}</p>
            </CardHeader>
            <CardContent className="p-5 pt-1 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {mockData?.latestNotice.title || 'Mid-term Assessment Schedule'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mockData?.latestNotice.summary || 'Review sessions will take place next week for all active cohorts.'}
              </p>
              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link to="/student/progress">View Assessment Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-foreground">
                Quick Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-2">
              <Link
                to="/student/courses"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Browse Available Courses</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/student/membership"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-primary" />
                  <span>Student ID & Membership</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/student/class-plan"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Timetable & Class Plan</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/student/progress"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Progress & Grade Report</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};