import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth.js';
import { useStudentProgress } from '../../hooks/useStudentData.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { SampleDataBadge } from '../../components/student/SampleDataBadge.js';
import { CardSkeleton } from '../../components/student/SkeletonLoader.js';
import { EmptyState } from '../../components/student/EmptyState.js';
import {
  Award,
  TrendingUp,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Lock,
  GraduationCap,
  X,
} from 'lucide-react';

export const StudentProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { data: coursesProgress, loading, error, reload } = useStudentProgress();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('CS-301');

  // Certificate Modal State
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);

  const studentName = user?.fullName || user?.full_name || user?.firstName || 'Student Name';
  const studentCode = user?.studentCode || user?.student_code || 'otc/00001/26';

  const selectedCourse = coursesProgress.find((c) => c.courseId === selectedCourseId) || coursesProgress[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Progress & Academic Report
            </h1>
            <SampleDataBadge />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Official grades, continuous assessment breakdown, score trends, and graduation certificates.
          </p>
        </div>

        {/* Header Action: Download/Print Report */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportModal(true)}
            className="text-xs gap-1.5 rounded-full"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            <span>Download Report</span>
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

      {/* 2. Course Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        {coursesProgress.map((course) => (
          <button
            key={course.courseId}
            onClick={() => setSelectedCourseId(course.courseId)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCourse?.courseId === course.courseId
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <span className="font-mono text-[11px]">{course.courseCode}</span>
            <span>{course.courseName}</span>
            <Badge
              variant={course.status === 'Completed' ? 'success' : 'subtle'}
              className="text-[9px] px-1.5 py-0 uppercase"
            >
              {course.status}
            </Badge>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
            <CardSkeleton rows={1} />
          </div>
          <CardSkeleton rows={4} />
        </div>
      ) : !selectedCourse ? (
        <EmptyState
          icon={Award}
          title="No Progress Data"
          description="Select an enrolled course to view grades and evaluation reports."
        />
      ) : (
        <>
          {/* 3. 4 Grade Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Grade */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Current Grade
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {selectedCourse.currentGradePercent}%
                  </span>
                  <span className="text-sm font-bold text-primary font-mono">
                    Grade {selectedCourse.currentGradeLetter}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Passing requirement: {selectedCourse.passingScore}%</p>
              </CardContent>
            </Card>

            {/* Assessments Completed */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Assessments Done
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {selectedCourse.completedAssessments}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    / {selectedCourse.totalAssessments} Total
                  </span>
                </div>
                <p className="text-xs text-primary font-medium mt-1">
                  {selectedCourse.totalAssessments - selectedCourse.completedAssessments} remaining
                </p>
              </CardContent>
            </Card>

            {/* Class Percentile / Rank */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Cohort Rank
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-foreground tracking-tight">
                    {selectedCourse.classRank}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Based on continuous grading</p>
              </CardContent>
            </Card>

            {/* Certificate Status Card */}
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Certificate
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-bold text-foreground block">
                      {selectedCourse.certificateEligible ? 'Graduation Issued' : 'Course In Progress'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  {selectedCourse.certificateEligible ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowCertificateModal(true)}
                      className="w-full text-xs gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Certificate</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Available after course completion"
                      className="w-full text-xs gap-1.5 cursor-not-allowed opacity-60"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Certificate Locked</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. Score Trend Line Chart */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Assessment Score Trend vs Cohort Average
                </CardTitle>
                <CardDescription className="text-xs">
                  Score progression across milestone tests and assignments
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedCourse.trend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="assessment"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[60, 100]}
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
                      formatter={(val: number | string | (number | string)[] | undefined, name: number | string | undefined) => [
                        `${val}%`,
                        name === 'score' ? 'Your Score' : 'Class Average',
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-foreground font-medium">
                          {value === 'score' ? 'Your Score (%)' : 'Class Average (%)'}
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--primary)' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="classAverage"
                      stroke="var(--muted-foreground)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 5. Assessment Scores Table */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Assessment Results & Scores
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed record of quizzes, labs, midterm exams, and capstone grades
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 text-muted-foreground border-b border-border uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Assessment Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Raw Score</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedCourse.assessments.map((asm) => (
                    <tr key={asm.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        <div>
                          <p>{asm.name}</p>
                          {asm.feedback && (
                            <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                              {asm.feedback}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">
                          {asm.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {asm.date}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-foreground whitespace-nowrap">
                        {asm.status === 'Graded' ? `${asm.score} / ${asm.maxScore}` : '&ndash;'}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-primary whitespace-nowrap">
                        {asm.status === 'Graded' ? `${asm.percentage}%` : 'Pending'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={asm.status === 'Graded' ? 'success' : 'secondary'}
                          className="text-[10px] font-semibold"
                        >
                          {asm.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {/* 6. Certificate View Modal Dialog */}
      {showCertificateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-dialog-title"
        >
          <div className="bg-card border-2 border-primary/40 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 text-center">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Certificate Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 id="cert-dialog-title" className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Certificate of Academic Achievement
              </h3>
              <p className="text-xs uppercase font-bold text-primary tracking-widest">
                Omishtu-Joy Training Center &bull; Accredited Technical Program
              </p>
            </div>

            {/* Certificate Body */}
            <div className="p-6 rounded-xl border border-border bg-secondary/30 space-y-3">
              <p className="text-xs text-muted-foreground">This is to officially certify that</p>
              <h4 className="text-2xl font-extrabold text-foreground tracking-tight underline decoration-primary decoration-2 underline-offset-4">
                {studentName}
              </h4>
              <p className="text-xs font-mono text-primary font-bold">Student ID: {studentCode}</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed pt-2">
                has successfully fulfilled all curriculum requirements, continuous assessments, and lab deliverables for
              </p>
              <p className="text-base font-bold text-foreground">
                {selectedCourse?.courseName} ({selectedCourse?.courseCode})
              </p>
              <p className="text-xs text-muted-foreground">
                with a Final Cumulative Distinction Grade of{' '}
                <span className="font-bold text-primary">{selectedCourse?.currentGradePercent}% (Grade {selectedCourse?.currentGradeLetter})</span>.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
              <div className="text-left">
                <p className="font-semibold text-foreground">Accreditation Board</p>
                <p className="text-[10px]">Academic Dean & Registrar</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">Certificate Serial</p>
                <p className="font-mono text-[10px] text-primary">{selectedCourse?.certificateId || 'CERT-OTC-2026'}</p>
              </div>
            </div>

            {/* Certificate Action */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 text-xs"
              >
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePrint}
                className="flex-1 text-xs gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / Save Certificate</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Printable Academic Report Modal Dialog */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Report Header */}
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 id="report-dialog-title" className="text-xl font-bold text-foreground">
                  Official Academic Transcript & Report
                </h3>
                <p className="text-xs text-muted-foreground">
                  Omishtu-Joy Training Center &bull; Student Records Office
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {new Date().toLocaleDateString()}
              </Badge>
            </div>

            {/* Student Info Metadata */}
            <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-secondary/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Student Name:</span>
                <p className="font-bold text-foreground mt-0.5">{studentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Student ID:</span>
                <p className="font-mono font-bold text-primary mt-0.5">{studentCode}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Course Module:</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedCourse?.courseName}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Cumulative Grade:</span>
                <p className="font-bold text-primary mt-0.5">
                  {selectedCourse?.currentGradePercent}% (Grade {selectedCourse?.currentGradeLetter})
                </p>
              </div>
            </div>

            {/* Summary Assessment Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Itemized Assessment Scores
              </h4>
              <table className="w-full text-xs text-left border border-border rounded-lg overflow-hidden">
                <thead className="bg-secondary text-muted-foreground text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2.5">Evaluation Item</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Score</th>
                    <th className="p-2.5">Percent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedCourse?.assessments.map((a) => (
                    <tr key={a.id}>
                      <td className="p-2.5 font-medium text-foreground">{a.name}</td>
                      <td className="p-2.5 text-muted-foreground">{a.date}</td>
                      <td className="p-2.5 font-mono text-foreground">{a.status === 'Graded' ? `${a.score}/${a.maxScore}` : '-'}</td>
                      <td className="p-2.5 font-mono font-bold text-primary">{a.status === 'Graded' ? `${a.percentage}%` : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportModal(false)}
                className="flex-1 text-xs"
              >
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePrint}
                className="flex-1 text-xs gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Report</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
