import React, { useState } from 'react';
import { useClassPlan } from '../../hooks/useStudentData.js';
import { Card, CardHeader, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
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
} from 'lucide-react';

export const ClassPlanPage: React.FC = () => {
  const { data, loading, error, reload } = useClassPlan();
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getWeekLabel = () => {
    if (weekOffset === 0) return data?.currentWeekLabel || 'Current Week';
    if (weekOffset < 0) return `Past Week (${Math.abs(weekOffset)} wks ago)`;
    return `Upcoming Week (+${weekOffset} wks)`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Class Plan & Timetable
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Weekly scheduled lectures, lab assignments, and review sessions.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
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
              <span className="hidden sm:inline">Grid View</span>
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
              <span className="hidden sm:inline">List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
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
            {data?.weekStart} &ndash; {data?.weekEnd}
          </p>
        </div>

        <Badge variant="subtle" className="text-xs font-semibold">
          7 Days / Week
        </Badge>
      </div>

      {/* 3. Timetable Content (Grid or List View) */}
      {loading ? (
        <CardSkeleton rows={6} />
      ) : !data?.days || data.days.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes scheduled for this week"
          description="Check another week or consult your course curriculum advisor."
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Horizontal Mon to Sun scrollable on small screens) */
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-3 min-w-[900px]">
            {data.days.map((day) => (
              <div
                key={day.day}
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
                  <p className="text-xs uppercase font-extrabold tracking-wider">{day.day.slice(0, 3)}</p>
                  <p className="text-sm font-semibold mt-0.5">{day.date}</p>
                </div>

                {/* Day Sessions Slots */}
                <div className="p-2 space-y-2 flex-1">
                  {day.slots.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center">
                      <span className="text-[11px] text-muted-foreground italic">No sessions</span>
                    </div>
                  ) : (
                    day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors text-left space-y-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-primary">
                            {slot.courseCode}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-card text-foreground font-semibold">
                            {slot.sessionType}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                          {slot.courseName}
                        </p>
                        <div className="pt-1 text-[11px] text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{slot.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{slot.room}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{slot.trainer}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* LIST VIEW (Optimized for Mobile & Linear reading) */
        <div className="space-y-4">
          {data.days.map((day) => (
            <Card
              key={day.day}
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
                    {day.day.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {day.day}, {day.date}
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
                  day.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl border border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">
                            {slot.courseCode}
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {slot.courseName}
                          </span>
                          <Badge variant="subtle" className="text-[10px]">
                            {slot.sessionType}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {slot.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {slot.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-primary" />
                            {slot.trainer}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
