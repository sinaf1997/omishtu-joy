import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCourseApi,
  getCourseByIdApi,
  updateCourseApi,
  listTrainersApi,
} from '../../../api/courses.js';
import {
  CourseType,
  CourseSlotInput,
  TrainerOption,
  CourseStatus,
} from '../../../types/courses.js';
import { WeeklyTimetableGrid } from '../../../components/academics/WeeklyTimetableGrid.js';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Save,
  Clock,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

export const CourseFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // Basic info state
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [courseType, setCourseType] = useState<CourseType>('major');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Dates & capacity state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [trainerId, setTrainerId] = useState<string>('');
  const [status, setStatus] = useState<CourseStatus>('open');
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);

  // Weekly timetable state
  const [slots, setSlots] = useState<CourseSlotInput[]>([
    { day_of_week: 1, start_time: '09:00', end_time: '11:00', room: '' },
  ]);

  // UI / Status state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Auto-calculated duration in weeks
  const durationWeeks = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return null;
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.ceil(diffDays / 7));
  }, [startDate, endDate]);

  // Load trainers and course details (if edit)
  useEffect(() => {
    async function init() {
      try {
        const trainersList = await listTrainersApi();
        setTrainers(trainersList);

        if (id) {
          const course = await getCourseByIdApi(id);
          setCode(course.code);
          setTitle(course.title);
          setCourseType(course.course_type);
          setDescription(course.description || '');
          setLocation(course.location || '');
          setStartDate(course.start_date.substring(0, 10));
          setEndDate(course.end_date.substring(0, 10));
          setCapacity(course.capacity);
          setTrainerId(course.trainer_id || '');
          if (course.slots && course.slots.length > 0) {
            setSlots(
              course.slots.map((s) => ({
                day_of_week: s.day_of_week,
                start_time: s.start_time.substring(0, 5),
                end_time: s.end_time.substring(0, 5),
                room: s.room || '',
              }))
            );
          }
        }
      } catch (err: any) {
        setFormError(err?.response?.data?.error?.message || 'Failed to load course details');
      } finally {
        setFetching(false);
      }
    }

    init();
  }, [id]);

  // Add timetable slot
  const handleAddSlot = () => {
    setSlots((prev) => [
      ...prev,
      { day_of_week: 1, start_time: '09:00', end_time: '11:00', room: location || '' },
    ]);
  };

  // Remove timetable slot
  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  // Update timetable slot field
  const handleSlotChange = (index: number, field: keyof CourseSlotInput, val: any) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Check for internal slot overlaps and duration errors
  const slotErrors = useMemo(() => {
    const errors: Record<number, string> = {};

    // 1. Minimum duration & order
    slots.forEach((slot, idx) => {
      const startM = timeToMinutes(slot.start_time);
      const endM = timeToMinutes(slot.end_time);

      if (endM <= startM) {
        errors[idx] = 'End time must be after start time';
      } else if (endM - startM < 30) {
        errors[idx] = 'Slot must be at least 30 minutes in duration';
      }
    });

    // 2. Overlaps on same day
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (Number(slots[i].day_of_week) === Number(slots[j].day_of_week)) {
          const s1 = timeToMinutes(slots[i].start_time);
          const e1 = timeToMinutes(slots[i].end_time);
          const s2 = timeToMinutes(slots[j].start_time);
          const e2 = timeToMinutes(slots[j].end_time);

          if (s1 < e2 && e1 > s2) {
            errors[i] = 'Overlaps with another slot on the same day';
            errors[j] = 'Overlaps with another slot on the same day';
          }
        }
      }
    }

    return errors;
  }, [slots]);

  const hasSlotErrors = Object.keys(slotErrors).length > 0;

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConflictError(null);

    if (hasSlotErrors) {
      setFormError('Please resolve timetable slot issues before submitting.');
      return;
    }

    if (slots.length === 0) {
      setFormError('A course must have at least one weekly timetable slot.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date must be on or after start date.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || null,
        course_type: courseType,
        duration_weeks: durationWeeks,
        start_date: startDate,
        end_date: endDate,
        capacity: Number(capacity),
        trainer_id: trainerId || null,
        location: location.trim() || null,
        status,
        slots: slots.map((s) => ({
          day_of_week: Number(s.day_of_week),
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room ? s.room.trim() : null,
        })),
      };

      if (isEdit && id) {
        await updateCourseApi(id, payload);
      } else {
        await createCourseApi(payload);
      }

      navigate('/staff/academics/courses');
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to save course';

      if (status === 409 && message.toLowerCase().includes('schedule conflict')) {
        setConflictError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading course information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/academics/courses')}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEdit ? 'Edit Course' : 'Create New Course'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Define catalog metadata, class cohorts, capacity limits, and weekly timetables.
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save course</p>
            <p className="text-xs mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">1. Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course Code */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Course Code <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="e.g. CS-101"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Unique identifier (uppercase letters, numbers, hyphens).
              </p>
            </div>

            {/* Course Title */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Course Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Full-Stack Software Engineering"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Course Type Segmented Control */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-foreground">
              Course Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 max-w-sm p-1 bg-muted/60 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setCourseType('major')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  courseType === 'major'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Major Course
              </button>
              <button
                type="button"
                onClick={() => setCourseType('elective')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  courseType === 'elective'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Elective Course
              </button>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
              💡 <strong>Enrollment Rule:</strong> A student can take 1 major course and up to 3
              electives at a time.
            </p>
          </div>

          {/* Description & Default Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Default Location / Hall
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Main Campus - Hall 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief course summary or goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dates, Capacity & Trainer */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">2. Dates & Capacity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Start Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                End Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Duration (Read-only) */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Duration (Auto-calculated)
              </label>
              <input
                type="text"
                readOnly
                value={durationWeeks ? `${durationWeeks} weeks` : '—'}
                className="w-full h-10 px-3 bg-muted/60 border border-border rounded-lg text-sm text-foreground cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Capacity */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Capacity Limit (Students) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Enter maximum cohort seat capacity (1 to 500).
              </p>
            </div>

            {/* Trainer Select */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Assigned Trainer (Optional)
              </label>
              <select
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No trainer assigned yet</option>
                {trainers.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.full_name}
                  </option>
                ))}
              </select>
            </div>

            {!isEdit && (
              <div className="sm:col-span-2 pt-2 border-t border-border">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Course Availability Status
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-muted/40 border border-border">
                  <button
                    type="button"
                    onClick={() => setStatus('open')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      status === 'open'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Open for Enrollment (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      status === 'draft'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Save as Draft
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {status === 'open'
                    ? '✓ Course will be immediately available in the enrollment options list.'
                    : '⚠️ Draft courses cannot accept student enrollments until opened.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Weekly Timetable */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">3. Weekly Timetable</h2>
            </div>
            <button
              type="button"
              onClick={handleAddSlot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add time slot
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Configure weekly recurring class hours and room assignments. Each slot must be at least
            30 minutes.
          </p>

          {/* Repeatable Slot Rows */}
          <div className="space-y-3">
            {slots.map((slot, index) => {
              const rowErr = slotErrors[index];

              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    rowErr
                      ? 'border-destructive/60 bg-destructive/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    {/* Day select */}
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Day of Week
                      </label>
                      <select
                        value={slot.day_of_week}
                        onChange={(e) =>
                          handleSlotChange(index, 'day_of_week', parseInt(e.target.value, 10))
                        }
                        className="w-full h-9 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        value={slot.start_time}
                        onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                        className="w-full h-9 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        required
                        value={slot.end_time}
                        onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                        className="w-full h-9 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Room & Remove button */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          Room / Lab
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          placeholder="e.g. Lab A"
                          value={slot.room || ''}
                          onChange={(e) => handleSlotChange(index, 'room', e.target.value)}
                          className="w-full h-9 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="p-2 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Remove slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {rowErr && (
                    <p className="text-[11px] text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {rowErr}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Server Conflict Error Banner */}
          {conflictError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-3 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Timetable Conflict Detected</p>
                <p className="mt-0.5">{conflictError}</p>
                <p className="mt-1 text-destructive/80">
                  Please change the conflicting room or trainer assignment to avoid double booking.
                </p>
              </div>
            </div>
          )}

          {/* Live Weekly Timetable Preview Grid */}
          <div className="pt-2">
            <WeeklyTimetableGrid slots={slots} />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/staff/academics/courses')}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || hasSlotErrors}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving course...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Course' : 'Create Course'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
