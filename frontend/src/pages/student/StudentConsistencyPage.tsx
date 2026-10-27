import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useStudentConsistency } from '../../hooks/useStudentData.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import {
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const StudentConsistencyPage: React.FC = () => {
  const { data, loading, error, reload } = useStudentConsistency();

  const getHeatmapColorClass = (status: 'present' | 'late' | 'absent' | 'no_class') => {
    switch (status) {
      case 'present':
        return 'bg-success text-success-foreground border-success/40';
      case 'late':
        return 'bg-warning text-warning-foreground border-warning/40';
      case 'absent':
        return 'bg-destructive text-destructive-foreground border-destructive/40';
      case 'no_class':
        return 'bg-muted/70 text-muted-foreground border-border/50';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Attendance Consistency & Streaks
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Track daily attendance discipline, calendar check-in habits, and course-by-course participation.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
          </div>
          <CardSkeleton rows={6} />
        </div>
      ) : (
        <>
          {/* 2. Top Streak & Consistency KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Streak */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Current Streak
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.currentStreak}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Days On Time</span>
                </div>
                <p className="text-xs text-primary font-medium mt-1">Active daily streak</p>
              </CardContent>
            </Card>

            {/* Best Streak */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Best Streak
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.bestStreak}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Consecutive Days</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Achieved in Sep 2026</p>
              </CardContent>
            </Card>

            {/* Overall Attendance Rate */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Attendance Rate
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.attendanceRate}%
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Overall</span>
                </div>
                <p className="text-xs text-primary font-medium mt-1">Minimum 85% required</p>
              </CardContent>
            </Card>

            {/* Sessions Total */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Sessions Attended
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.totalSessionsAttended}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    / {data?.totalSessionsScheduled} Total
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">2 excused absences</p>
              </CardContent>
            </Card>
          </div>

          {/* 3. Calendar Heatmap (Last 12 Weeks) */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  12-Week Attendance Heatmap
                </CardTitle>
                <CardDescription className="text-xs">
                  Session attendance recorded by the reception and instructor tablets.
                </CardDescription>
              </div>

              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-success border border-success/40" />
                  <span className="text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-warning border border-warning/40" />
                  <span className="text-muted-foreground">Late (&lt;15m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-destructive border border-destructive/40" />
                  <span className="text-muted-foreground">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-muted/70 border border-border/50" />
                  <span className="text-muted-foreground">No Class</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Day of Week row headers */}
                <div className="grid grid-cols-12 gap-2 text-center mb-1">
                  {data?.weeks.map((_, wIdx) => (
                    <span key={wIdx} className="text-[10px] text-muted-foreground font-semibold uppercase">
                      W{wIdx + 1}
                    </span>
                  ))}
                </div>

                {/* 7 rows for days of week (Sun to Sat) */}
                <div className="space-y-1.5">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dIdx) => (
                    <div key={dayName} className="flex items-center gap-2">
                      <span className="w-8 text-[10px] font-bold text-muted-foreground uppercase text-right shrink-0">
                        {dayName}
                      </span>
                      <div className="grid grid-cols-12 gap-2 flex-1">
                        {data?.weeks.map((week, wIdx) => {
                          const day = week[dIdx];
                          if (!day) return <div key={wIdx} className="h-6 rounded-md bg-muted" />;
                          return (
                            <div
                              key={wIdx}
                              title={`${day.date} (${dayName}): ${day.status.replace('_', ' ').toUpperCase()} - ${day.note || ''}`}
                              className={`h-6 rounded-md border flex items-center justify-center text-[10px] font-bold cursor-default transition-transform hover:scale-110 ${getHeatmapColorClass(
                                day.status
                              )}`}
                            >
                              {day.status === 'present' ? '✓' : day.status === 'late' ? 'L' : day.status === 'absent' ? '✕' : ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Bottom Grid: Course-by-Course Attendance & Monthly Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Attendance Breakdown */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Attendance Rate per Course
                </CardTitle>
                <CardDescription className="text-xs">
                  Hours attended vs total scheduled curriculum hours
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {data?.courseBreakdown.map((item) => (
                  <div key={item.courseId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{item.courseName}</span>
                      <span className="font-bold text-primary font-mono">{item.rate}%</span>
                    </div>
                    {/* Progress Bar with theme tokens */}
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{item.attendedHours} of {item.totalHours} hours attended</span>
                      <span>Target: &ge; 85%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly Attendance Chart */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Monthly Attendance History (%)
                </CardTitle>
                <CardDescription className="text-xs">
                  Consistency trend across the last 4 calendar months
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[80, 100]}
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '0.75rem',
                          color: 'var(--foreground)',
                          fontSize: '12px',
                        }}
                        formatter={(val: number | string | (number | string)[] | undefined) => [`${val}%`, 'Attendance Rate']}
                      />
                      <Bar
                        dataKey="rate"
                        fill="var(--primary)"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
