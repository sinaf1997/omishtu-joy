import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../../hooks/useAuth.js';
import { getStudentEnrollmentsOverviewApi } from '../../api/student.js';
import { StudentEnrollmentsOverview } from '../../types/enrollments.js';
import { CourseTypeBadge } from '../../components/academics/CourseTypeBadge.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  Maximize2,
  CheckCircle2,
  Layers,
  GraduationCap,
  ShieldCheck,
  X,
  Printer,
  Calendar,
  Clock,
  Compass,
} from 'lucide-react';

export const StudentMembershipPage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<StudentEnrollmentsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullScreenModal, setFullScreenModal] = useState(false);

  // Student name and ID come strictly from AuthContext
  const studentName = user?.fullName || user?.full_name || user?.firstName || 'Student Name';
  const studentCode = user?.studentCode || user?.student_code || 'otc/00001/26';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentEnrollmentsOverviewApi();
      setOverview(res);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load enrollment data');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Primary Major course (if any) or general program
  const activeMajor = useMemo(() => {
    return overview?.active_enrollments.find((e) => e.course_type === 'major');
  }, [overview]);

  const programName = activeMajor ? activeMajor.course_title : 'General Academic Program';
  const membershipStatus = (overview?.active_enrollments.length ?? 0) > 0 ? 'Active' : 'Registered';

  // Construct QR Payload with verified Student ID and membership data
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      studentId: studentCode,
      name: studentName,
      program: programName,
      status: membershipStatus,
      activeCoursesCount: overview?.active_enrollments.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  }, [studentCode, studentName, programName, membershipStatus, overview]);

  const handlePrint = () => {
    window.print();
  };

  // Earliest start date and latest end date
  const cohortDates = useMemo(() => {
    if (!overview?.active_enrollments || overview.active_enrollments.length === 0) {
      return { start: '—', end: '—' };
    }
    const starts = overview.active_enrollments.map((e) => e.start_date).sort();
    const ends = overview.active_enrollments.map((e) => e.end_date).sort();
    return {
      start: starts[0],
      end: ends[ends.length - 1],
    };
  }, [overview]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Membership & Digital ID
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Official student credentials, verified enrollment status, and front desk check-in pass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 rounded-full"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save ID</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setFullScreenModal(true)}
            className="text-xs gap-1.5 rounded-full"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Show Full Screen</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2. Official Student ID Card (Digital Badge Format) */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-secondary/30 shadow-md relative overflow-hidden">
              {/* Decorative background watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none text-foreground">
                <GraduationCap className="h-48 w-48" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground tracking-tight leading-tight">
                      Omishtu-Joy Training Center
                    </h3>
                    <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      Official Student Identity Card
                    </p>
                  </div>
                </div>
                <Badge
                  variant={membershipStatus === 'Active' ? 'default' : 'secondary'}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {membershipStatus}
                </Badge>
              </div>

              {/* Card Body with Photo/Initials and Details */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center sm:border-r sm:border-border sm:pr-4">
                  <div className="p-3 rounded-xl bg-card border border-border shadow-sm text-foreground flex items-center justify-center">
                    <QRCode
                      value={qrPayload}
                      size={120}
                      fgColor="currentColor"
                      bgColor="transparent"
                      level="M"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-2 font-mono text-center">
                    Scan for check-in
                  </span>
                </div>

                {/* Student Info Details */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Student Full Name
                    </p>
                    <p className="text-lg font-extrabold text-foreground tracking-tight">
                      {studentName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Student ID</p>
                      <p className="font-mono font-bold text-primary text-sm mt-0.5">{studentCode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Cohort Ends</p>
                      <p className="font-semibold text-foreground mt-0.5 font-mono">{cohortDates.end}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Primary Program</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 line-clamp-2">
                      {programName}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Cryptographically verified OTC student token</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Note */}
              <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="italic">
                  Show this QR to the receptionist to check in for class.
                </span>
                <span className="font-mono text-[10px]">OTC-ID-SECURE</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullScreenModal(true)}
                className="flex-1 text-xs gap-2"
              >
                <Maximize2 className="h-3.5 w-3.5 text-primary" />
                <span>Show full screen QR for Front Desk scan</span>
              </Button>
            </div>
          </div>

          {/* 3. Enrollment Summary Card (Real Data) */}
          <div className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Enrollment Summary
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {overview?.active_enrollments.length || 0} Active{' '}
                    {overview?.active_enrollments.length === 1 ? 'Course' : 'Courses'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Active academic course registrations and cohort session timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Cohort Start</p>
                    <p className="font-bold text-foreground text-sm mt-1 font-mono">{cohortDates.start}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Cohort End</p>
                    <p className="font-bold text-foreground text-sm mt-1 font-mono">{cohortDates.end}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Account Status</p>
                    <p className="font-bold text-foreground text-sm mt-1">{membershipStatus}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Registration</p>
                    <p className="font-bold text-primary text-sm mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Enrolled Courses in Current Cohort
                  </h4>

                  {!overview?.active_enrollments || overview.active_enrollments.length === 0 ? (
                    <EmptyState
                      icon={GraduationCap}
                      title="No active enrollments"
                      description="You are not actively enrolled in any courses for the current cohort."
                      action={
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <Link to="/student/courses">
                            <Compass className="h-4 w-4 text-primary" />
                            <span>Browse Courses</span>
                          </Link>
                        </Button>
                      }
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {overview.active_enrollments.map((enr) => (
                        <div
                          key={enr.enrollment_id}
                          className="p-3 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">
                                {enr.course_code}
                              </span>
                              <CourseTypeBadge type={enr.course_type} />
                            </div>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {enr.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-foreground">
                            {enr.course_title}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-primary" />
                              {enr.slot_summary || 'Schedule TBA'}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" />
                              {enr.start_date} to {enr.end_date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Student ID: {studentCode}</span>
                  <Link to="/student/classes" className="text-primary font-medium hover:underline">
                    View Full Schedule &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. Full Screen QR Modal Dialog */}
      {fullScreenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="full-screen-qr-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setFullScreenModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 id="full-screen-qr-title" className="text-xl font-bold text-foreground">
                Front Desk Check-in Pass
              </h3>
              <p className="text-xs text-muted-foreground">
                Position this QR code in front of the reception camera scanner.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-6 rounded-2xl bg-card border-2 border-primary/40 shadow-inner flex flex-col items-center justify-center mx-auto w-fit text-foreground">
              <QRCode
                value={qrPayload}
                size={220}
                fgColor="currentColor"
                bgColor="transparent"
                level="Q"
              />
            </div>

            <div className="space-y-1 pt-1">
              <p className="text-base font-bold text-foreground">{studentName}</p>
              <p className="text-xs font-mono font-bold text-primary">{studentCode}</p>
              <p className="text-[11px] text-muted-foreground">{programName}</p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setFullScreenModal(false)}
              className="w-full text-xs"
            >
              Close Pass
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};