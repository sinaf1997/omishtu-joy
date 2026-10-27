import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { getCourseByIdApi } from '../../../api/courses.js';
import { Course } from '../../../types/courses.js';
import { CourseTypeBadge } from '../../../components/academics/CourseTypeBadge.js';
import { CourseStatusBadge } from '../../../components/academics/CourseStatusBadge.js';
import { WeeklyTimetableGrid } from '../../../components/academics/WeeklyTimetableGrid.js';
import { ChangeStatusModal } from '../../../components/academics/ChangeStatusModal.js';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  Edit2,
  RefreshCw,
  AlertCircle,
  Loader2,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManage =
    user?.role === 'owner' || user?.role === 'manager' || user?.role === 'academic_admin';

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCourseByIdApi(id);
      setCourse(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Course not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Course Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || 'Unable to retrieve course details.'}</p>
        <button
          onClick={() => navigate('/staff/academics/courses')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
      </div>
    );
  }

  const capacityPercent = Math.min(
    100,
    Math.round((course.enrolled_count / course.capacity) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/academics/courses')}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-xl text-primary">{course.code}</span>
              <CourseTypeBadge type={course.course_type} />
              <CourseStatusBadge status={course.status} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {course.title}
            </h1>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              Change Status
            </button>
            <button
              onClick={() => navigate(`/staff/academics/courses/${course.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Course
            </button>
          </div>
        )}
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Seat Capacity</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">
              {course.enrolled_count} / {course.capacity}
            </span>
            <span className="text-xs text-muted-foreground">{capacityPercent}% full</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Schedule & Duration */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Duration</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {course.duration_weeks ? `${course.duration_weeks} Weeks` : '—'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{course.slot_summary}</p>
        </div>

        {/* Date Range */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Cohort Period</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs font-semibold text-foreground space-y-0.5">
            <div>Starts: {course.start_date.substring(0, 10)}</div>
            <div>Ends: {course.end_date.substring(0, 10)}</div>
          </div>
        </div>

        {/* Assigned Trainer */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Lead Trainer</span>
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-base font-bold text-foreground truncate">
            {course.trainer_name || 'Unassigned'}
          </p>
          <p className="text-xs text-muted-foreground">
            {course.trainer_name ? 'Active instructor' : 'Pending assignment'}
          </p>
        </div>
      </div>

      {/* Course Overview & Location */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Course Information & Description
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="md:col-span-2 space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Description</span>
            <p className="text-foreground leading-relaxed">
              {course.description || (
                <span className="italic text-muted-foreground">No description provided.</span>
              )}
            </p>
          </div>

          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Default Location
              </span>
              <span className="text-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                {course.location || 'Main Campus'}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block font-medium">Curriculum Type</span>
              <span className="text-foreground font-semibold capitalize">
                {course.course_type} Course
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Timetable Preview Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Weekly Class Timetable
        </h3>
        <WeeklyTimetableGrid slots={course.slots} />
      </div>

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <ChangeStatusModal
          course={course}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={fetchCourse}
        />
      )}
    </div>
  );
};
