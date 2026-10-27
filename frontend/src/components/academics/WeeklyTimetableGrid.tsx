import React from 'react';
import { CourseSlotInput } from '../../types/courses.js';
import { MapPin, Clock } from 'lucide-react';

interface WeeklyTimetableGridProps {
  slots: CourseSlotInput[];
  className?: string;
}

const DAYS = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 7, name: 'Sunday', short: 'Sun' },
];

export const WeeklyTimetableGrid: React.FC<WeeklyTimetableGridProps> = ({ slots, className = '' }) => {
  return (
    <div className={`border border-border rounded-lg overflow-hidden bg-card ${className}`}>
      <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Weekly Timetable Preview
        </h4>
        <span className="text-xs text-muted-foreground">
          {slots.length} {slots.length === 1 ? 'slot' : 'slots'} configured
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {DAYS.map(({ day, name, short }) => {
          const daySlots = slots
            .filter((s) => Number(s.day_of_week) === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day} className="flex flex-col min-h-[140px] p-2.5">
              <div className="pb-2 mb-2 border-b border-border/60 flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">{short}</span>
                <span className="text-[10px] text-muted-foreground hidden lg:inline">{name}</span>
                {daySlots.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                    {daySlots.length}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                {daySlots.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50 py-4">
                    —
                  </div>
                ) : (
                  daySlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md bg-muted/60 border border-border text-xs space-y-1 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Clock className="w-3 h-3 text-primary shrink-0" />
                        <span>
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </span>
                      </div>
                      {slot.room && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                          <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{slot.room}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
