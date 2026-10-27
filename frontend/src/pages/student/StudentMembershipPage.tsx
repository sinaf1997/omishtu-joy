import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../hooks/useAuth.js';
import { useStudentMembership } from '../../hooks/useStudentData.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import {
  Maximize2,
  CheckCircle2,
  Layers,
  GraduationCap,
  ShieldCheck,
  X,
  Printer,
} from 'lucide-react';

export const StudentMembershipPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useStudentMembership();
  const [fullScreenModal, setFullScreenModal] = useState(false);

  // Student name and ID come strictly from AuthContext
  const studentName = user?.fullName || user?.full_name || user?.firstName || 'Student Name';
  const studentCode = user?.studentCode || user?.student_code || 'otc/00001/26';

  // Construct QR Payload with Student ID and verification token
  const qrPayload = JSON.stringify({
    studentId: studentCode,
    name: studentName,
    program: data?.programName || 'Software Engineering',
    token: data?.verificationToken || 'OTC-VERIFY-9A82B3C7E1-SECURE',
    status: data?.status || 'Active',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Membership & Digital ID
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Official student credentials, enrollment status, and front desk check-in pass.
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
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
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
                  variant={data?.status === 'Active' ? 'success' : 'outline'}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {data?.status || 'Active'}
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
                    Scan for verification
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
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Valid Until</p>
                      <p className="font-semibold text-foreground mt-0.5">{data?.validUntil}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Program</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 line-clamp-2">
                      {data?.programName}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Cryptographically verifiable QR token</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Note */}
              <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="italic">
                  Show this QR to the receptionist to verify your enrollment.
                </span>
                <span className="font-mono text-[10px]">OTC-ID</span>
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

          {/* 3. Enrollment Summary Card */}
          <div className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Enrollment Summary
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {data?.cohort}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Active academic registration & curriculum credits
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Start Date</p>
                    <p className="font-bold text-foreground text-sm mt-1">{data?.startDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">End Date</p>
                    <p className="font-bold text-foreground text-sm mt-1">{data?.endDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Total Training</p>
                    <p className="font-bold text-foreground text-sm mt-1">{data?.totalTrainingHours} Hours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-muted-foreground font-medium uppercase text-[10px]">Tuition Status</p>
                    <p className="font-bold text-primary text-sm mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {data?.tuitionStatus}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Enrolled Courses in Current Cohort
                  </h4>
                  <div className="space-y-2">
                    {data?.enrolledCourses.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-foreground">{c}</span>
                        <Badge variant="subtle" className="text-[10px]">
                          Enrolled
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Issued Date: {data?.cardIssueDate}</span>
                  <span className="font-mono text-[11px] text-primary font-semibold">
                    Token: {data?.verificationToken.slice(0, 14)}...
                  </span>
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
              <p className="text-[11px] text-muted-foreground">{data?.programName}</p>
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
