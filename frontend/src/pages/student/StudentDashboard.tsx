import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useStudentDashboard } from '../../hooks/useStudentData.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { Skeleton, CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  BookOpen,
  CheckCircle2,
  Award,
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
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useStudentDashboard();

  const studentName = user?.fullName || user?.full_name || user?.firstName || 'Student';
  const studentCode = user?.studentCode || user?.student_code || 'otc/00001/26';

  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'book':
        return <BookOpen className="h-5 w-5" />;
      case 'check':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'award':
        return <Award className="h-5 w-5" />;
      case 'creditCard':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Greeting & Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {studentName}!
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Student ID: <span className="font-mono font-bold text-primary">{studentCode}</span> &bull; Fall Session 2026
          </p>
        </div>

        {/* Quick links header pill */}
        <div className="flex items-center gap-2">
          <Link to="/student/membership">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full">
              <IdCard className="h-3.5 w-3.5 text-primary" />
              <span>Student ID Card</span>
            </Button>
          </Link>
          <Link to="/student/class-plan">
            <Button variant="default" size="sm" className="text-xs gap-1.5 rounded-full">
              <Calendar className="h-3.5 w-3.5" />
              <span>My Class Plan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
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
      ) : data?.stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.stats.map((stat, i) => (
            <Card key={i} className="shadow-sm border-border bg-card hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                    {getStatIcon(stat.iconName)}
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">
                  {stat.value}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-muted-foreground">{stat.subtext}</span>
                  {stat.trend && (
                    <span className="text-primary font-medium">{stat.trend}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* 3. Main Split Grid: Left (Classes) / Right (Streak & Notice & Quick Links) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Classes & Upcoming this week */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Card */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Today&apos;s Classes
                </CardTitle>
                <CardDescription className="text-xs">
                  Your scheduled training sessions for today
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                {data?.todayClasses?.length || 0} Sessions
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !data?.todayClasses || data.todayClasses.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No classes scheduled today"
                  description="You have no lectures or lab sessions today. Enjoy your self-study time!"
                />
              ) : (
                data.todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3.5 rounded-xl border border-border bg-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {cls.courseName}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {cls.courseCode}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {cls.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {cls.room}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-primary" />
                          {cls.trainer}
                        </span>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs shrink-0 self-start sm:self-center">
                      {cls.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming this week */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Upcoming This Week
                </CardTitle>
                <CardDescription className="text-xs">
                  Remaining sessions and workshops
                </CardDescription>
              </div>
              <Link to="/student/class-plan" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Full Plan <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : !data?.upcomingThisWeek || data.upcomingThisWeek.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming classes this week"
                  description="Check your full curriculum timetable for next week's schedule."
                />
              ) : (
                data.upcomingThisWeek.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-12 rounded-lg bg-secondary text-center flex flex-col justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground leading-tight">
                          {item.day.slice(0, 3)}
                        </span>
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {item.date}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.courseName}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{item.time}</span>
                          <span>&bull;</span>
                          <span>{item.room}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium sm:text-right">
                      {item.trainer}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Streak, Notice, Quick Links */}
        <div className="space-y-6">
          {/* Attendance Streak Mini Card */}
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Attendance Streak
                </span>
                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Flame className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {data?.streak.currentDays ?? 0}
                </span>
                <span className="text-xs text-muted-foreground font-medium">consecutive days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {data?.streak.message}
              </p>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Personal best</span>
                <span className="font-semibold text-foreground">{data?.streak.bestDays} Days</span>
              </div>
            </CardContent>
          </Card>

          {/* Latest Grade / Notice Card */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  Latest Announcement
                </CardTitle>
                <Badge variant="subtle" className="text-[10px]">
                  {data?.latestNotice.category}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{data?.latestNotice.date}</p>
            </CardHeader>
            <CardContent className="p-5 pt-1 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {data?.latestNotice.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data?.latestNotice.summary}
              </p>
              <div className="pt-2">
                <Link to="/student/progress">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Assessment Details
                  </Button>
                </Link>
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
