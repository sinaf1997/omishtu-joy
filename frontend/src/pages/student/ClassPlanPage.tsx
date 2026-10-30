import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStudentScheduleApi } from '../../api/student.js';
import { StudentScheduleSlot } from '../../types/enrollments.js';
import { CourseTypeBadge } from '../../components/academics/CourseTypeBadge.js';
import { Card, CardHeader, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  LayoutGrid,
  List,
  Compass,
  Hourglass,
} from 'lucide-react';

const WEEKDAYS = [
  { dayOfWeek: 1, name: 'Monday', short: 'Mon' },
  { dayOfWeek: 2, name: 'Tuesday', short: 'Tue' },
  { dayOfWeek: 3, name: 'Wednesday', short: 'Wed' },
  { dayOfWeek: 4, name: 'Thursday', short: 'Thu' },
  { dayOfWeek: 5, name: 'Friday', short: 'Fri' },
  { dayOfWeek: 6, name: 'Saturday', short: 'Sat' },
  { dayOfWeek: 7, name: 'Sunday', short: 'Sun' },
];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ClassPlanPage: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPending, setShowPending] = useState<boolean>(true);

  const [slots, setSlots] = useState<StudentScheduleSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentScheduleApi(showPending);
      setSlots(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load class schedule');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [showPending]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Compute Monday for the displayed week
  const mondayDate = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const sundayDate = useMemo(() => {
    const s = new Date(mondayDate);
    s.setDate(s.getDate() + 6);
    return s;
  }, [mondayDate]);

  const todayIso = useMemo(() => formatDateISO(new Date()), []);

  // Compute 7 days for the selected week
  const weekDays = useMemo(() => {
    return WEEKDAYS.map((w, idx) => {
      const d = new Date(mondayDate);
      d.setDate(d.getDate() + idx);
      const dateIso = formatDateISO(d);
      const isToday = dateIso === todayIso;

      // Filter slots that:
      // 1. match the day of week
      // 2. fall within course start_date and end_date
      const daySlots = slots
        .filter((slot) => {
          if (slot.day_of_week !== w.dayOfWeek) return false;
          return dateIso >= slot.start_date && dateIso <= slot.end_date;
        })
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      return {
        ...w,
        date: d,
        dateIso,
        dateLabel: formatDayLabel(d),
        isToday,
        slots: daySlots,
      };
    });
  }, [mondayDate, slots, todayIso]);

  const totalSessionsThisWeek = useMemo(() => {
    return weekDays.reduce((acc, d) => acc + d.slots.length, 0);
  }, [weekDays]);

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    if (weekOffset === 1) return 'Next Week';
    if (weekOffset < 0) return `${Math.abs(weekOffset)} weeks ago`;
    return `In ${weekOffset} weeks`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Class Plan & Timetable
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Weekly scheduled sessions, room assignments, and pending elective slots.
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Pending Requests */}
          <button
            type="button"
            onClick={() => setShowPending(!showPending)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              showPending
                ? 'bg-warning/10 text-warning border-warning/30'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Hourglass className="h-3.5 w-3.5" />
            <span>Show Pending Requests</span>
          </button>

          {/* Grid vs List View toggle */}
          <div className="flex items-center bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Weekly Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Daily List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadSchedule}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. Week Switcher Bar */}
      <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="h-8 px-2 text-xs"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={weekOffset === 0 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="h-8 text-xs font-semibold"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="h-8 px-2 text-xs"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <h3 className="font-bold text-sm text-foreground">{getWeekLabel()}</h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {formatDateISO(mondayDate)} &ndash; {formatDateISO(sundayDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="subtle" className="text-xs font-semibold">
            {totalSessionsThisWeek} {totalSessionsThisWeek === 1 ? 'Session' : 'Sessions'}
          </Badge>
        </div>
      </div>

      {/* 3. Timetable Content (Grid or List View) */}
      {loading ? (
        <CardSkeleton rows={6} />
      ) : totalSessionsThisWeek === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes scheduled for this week"
          description="You do not have any active course sessions falling within this date range. You can check another week or browse the course catalog."
          action={
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/student/courses">
                <Compass className="h-4 w-4 text-primary" />
                <span>Browse Available Courses</span>
              </Link>
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Horizontal Mon to Sun scrollable on small screens) */
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-3 min-w-[900px]">
            {weekDays.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`rounded-xl border flex flex-col min-h-[380px] bg-card ${
                  day.isToday ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 text-center border-b border-border rounded-t-xl ${
                    day.isToday ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary/40'
                  }`}
                >
                  <p className="text-xs uppercase font-extrabold tracking-wider">{day.short}</p>
                  <p className="text-sm font-semibold mt-0.5">{day.dateLabel}</p>
                </div>

                {/* Day Sessions Slots */}
                <div className="p-2 space-y-2 flex-1">
                  {day.slots.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center">
                      <span className="text-[11px] text-muted-foreground italic">No sessions</span>
                    </div>
                  ) : (
                    day.slots.map((slot) => {
                      const isPending = slot.pending;
                      return (
                        <div
                          key={slot.slot_id}
                          className={`p-2.5 rounded-lg text-left space-y-1 transition-colors ${
                            isPending
                              ? 'border-2 border-dashed border-warning/40 bg-warning/5 text-muted-foreground'
                              : 'border border-border bg-secondary/50 hover:bg-secondary text-foreground shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-primary">
                              {slot.course_code}
                            </span>
                            {isPending ? (
                              <Badge
                                variant="secondary"
                                className="bg-warning/15 text-warning text-[9px] px-1.5 py-0 font-bold"
                              >
                                Pending
                              </Badge>
                            ) : (
                              <CourseTypeBadge type={slot.course_type} />
                            )}
                          </div>

                          <p className="text-xs font-bold leading-snug line-clamp-2">
                            {slot.course_title}
                          </p>

                          <div className="pt-1 text-[11px] space-y-0.5">
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              <Clock className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate">{slot.room || 'Room TBA'}</span>
                            </div>
                            {slot.trainer_name && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3 text-primary shrink-0" />
                                <span className="truncate">{slot.trainer_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* LIST VIEW (Optimized for Mobile & Linear reading) */
        <div className="space-y-4">
          {weekDays.map((day) => (
            <Card
              key={day.dayOfWeek}
              className={`border-border bg-card ${
                day.isToday ? 'border-primary shadow-sm' : ''
              }`}
            >
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                      day.isToday
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {day.short}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {day.name}, {day.dateLabel}
                    </h3>
                    {day.isToday && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        Today&apos;s Schedule
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {day.slots.length} {day.slots.length === 1 ? 'Session' : 'Sessions'}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-2.5">
                {day.slots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No classes scheduled for this day.
                  </p>
                ) : (
                  day.slots.map((slot) => {
                    const isPending = slot.pending;
                    return (
                      <div
                        key={slot.slot_id}
                        className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isPending
                            ? 'border-2 border-dashed border-warning/40 bg-warning/5'
                            : 'border border-border bg-secondary/30'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-primary">
                              {slot.course_code}
                            </span>
                            <span className="font-bold text-xs text-foreground">
                              {slot.course_title}
                            </span>
                            {isPending ? (
                              <Badge
                                variant="secondary"
                                className="bg-warning/15 text-warning text-[10px] font-bold"
                              >
                                Pending Request
                              </Badge>
                            ) : (
                              <CourseTypeBadge type={slot.course_type} />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              {slot.room || 'Room TBA'}
                            </span>
                            {slot.trainer_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-primary" />
                                {slot.trainer_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};