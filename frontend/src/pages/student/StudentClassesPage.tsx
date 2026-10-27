import React, { useState, useMemo } from 'react';
import { useStudentClasses } from '../../hooks/useStudentData.js';
import { StudentCourse } from '../../data/mock/student.js';
import { Card, CardContent, CardFooter } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  BookOpen,
  Clock,
  MapPin,
  User,
  X,
  ListOrdered,
} from 'lucide-react';

export const StudentClassesPage: React.FC = () => {
  const { data: courses, loading, error, reload } = useStudentClasses();
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Waitlisted'>('Active');
  const [selectedCourse, setSelectedCourse] = useState<StudentCourse | null>(null);

  // Group courses by status
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => c.status === activeTab);
  }, [courses, activeTab]);

  const activeCount = courses.filter((c) => c.status === 'Active').length;
  const completedCount = courses.filter((c) => c.status === 'Completed').length;
  const waitlistedCount = courses.filter((c) => c.status === 'Waitlisted').length;

  const getAttendanceBadgeVariant = (status: 'present' | 'absent' | 'late' | 'upcoming') => {
    switch (status) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'destructive';
      case 'upcoming':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Courses & Sessions
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Enrolled training courses, syllabus progress, schedule, and session attendance tracking.
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

      {/* 2. Status Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('Active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'Active'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <span>Active Courses</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'Active' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'Completed'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <span>Completed</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'Completed' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Waitlisted')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'Waitlisted'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <span>Waitlisted</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'Waitlisted' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
            {waitlistedCount}
          </span>
        </button>
      </div>

      {/* 3. Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`No ${activeTab.toLowerCase()} courses`}
          description={
            activeTab === 'Waitlisted'
              ? 'You do not have any pending waitlisted courses. You are fully enrolled in your cohort!'
              : `You have no ${activeTab.toLowerCase()} courses recorded.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
            >
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-primary">
                      {course.code}
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-0.5 leading-snug">
                      {course.name}
                    </h3>
                  </div>
                  <Badge
                    variant={course.status === 'Active' ? 'default' : 'outline'}
                    className="text-xs font-semibold shrink-0"
                  >
                    {course.status}
                  </Badge>
                </div>

                {/* Trainer & Room */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {course.trainer}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {course.room}
                  </span>
                </div>

                {/* Schedule */}
                <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-xs flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{course.schedule}</span>
                </div>

                {/* Progress Bar & Attendance Rate */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">Syllabus Completion</span>
                      <span className="font-bold text-foreground font-mono">{course.progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-bold text-primary font-mono">{course.attendanceRate}%</span>
                  </div>

                  {course.nextSession && (
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Next Session:</span>
                      <span className="font-semibold text-foreground">{course.nextSession}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Action Button: Open Detail Dialog */}
              <CardFooter className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {course.sessions.length} curriculum sessions
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourse(course)}
                  className="text-xs gap-1.5"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span>View Sessions & Attendance</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Course Details & Session Attendance Dialog */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-detail-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {selectedCourse.code}
                </Badge>
                <Badge variant="default" className="text-[10px]">
                  {selectedCourse.status}
                </Badge>
              </div>
              <h3 id="course-detail-title" className="text-xl font-bold text-foreground mt-1">
                {selectedCourse.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Instructor: <span className="font-semibold text-foreground">{selectedCourse.trainer}</span> &bull; {selectedCourse.room}
              </p>
            </div>

            {/* Syllabus Overview */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground leading-relaxed">
              <p className="font-bold text-foreground mb-1 uppercase tracking-wider text-[10px]">
                Course Overview & Objectives
              </p>
              {selectedCourse.syllabusOverview}
            </div>

            {/* Session Attendance Records */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Session Attendance Breakdown
                </h4>
                <span className="text-xs text-primary font-bold font-mono">
                  {selectedCourse.attendanceRate}% Overall
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedCourse.sessions.map((sess) => (
                  <div
                    key={sess.sessionNumber}
                    className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-md bg-secondary text-foreground font-bold flex items-center justify-center text-xs shrink-0">
                        {sess.sessionNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{sess.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {sess.date} &bull; {sess.time}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={getAttendanceBadgeVariant(sess.status)}
                      className="text-[10px] capitalize font-semibold shrink-0"
                    >
                      {sess.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourse(null)}
                className="w-full text-xs"
              >
                Close Course Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
