import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentByIdApi } from '../../api/students.js';
import { StudentRecord } from '../../types/students.js';
import { Button } from '../../components/ui/button.js';
import {
  Layers,
  Printer,
  ArrowLeft,
  Calendar,
  UserCheck,
  Globe,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

export const StudentSlipPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const data = await getStudentByIdApi(id);
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve student record');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-xs text-muted-foreground animate-pulse">
        Generating welcome slip...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-base font-bold text-foreground">Welcome Slip Unavailable</h2>
        <p className="text-xs text-muted-foreground">{error || 'Could not load student information.'}</p>
        <Link to="/staff/reception/students">
          <Button size="sm" variant="outline" className="rounded-full text-xs">
            Back to Student List
          </Button>
        </Link>
      </div>
    );
  }

  const sId = student.studentCode || student.student_code || 'otc/—/—';
  const firstName = student.firstName || student.first_name || '';
  const lastName = student.lastName || student.last_name || '';
  const fullName = student.fullName || student.full_name || `${firstName} ${lastName}`.trim() || sId;
  const receptionistName = student.registeredByStaffName || student.registered_by_staff_name || 'Front Desk Reception';
  const regDate = student.registeredAt || student.registered_at || student.createdAt || student.created_at;
  const loginUrl = `${window.location.origin}/student/login`;

  return (
    <div className="min-h-screen py-6 px-4 bg-background">
      {/* Top action controls: Hidden when printing */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          to={`/staff/reception/students/${student.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to student details</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-full px-5 text-xs font-semibold shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print welcome slip</span>
          </Button>
        </div>
      </div>

      {/* Welcome Slip Document Sheet (Always clean light document format) */}
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-lg p-8 sm:p-10 space-y-8 print:shadow-none print:border-border print:p-6 print:m-0 print:max-w-none">
        {/* Header: Center Name and Logo */}
        <div className="text-center space-y-2 border-b border-border pb-6">
          <div className="h-14 w-14 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center shadow-xs">
            <Layers className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-foreground">
              Omishtu-Joy Training Center
            </h1>
            <p className="text-xs uppercase font-semibold text-primary tracking-widest flex items-center justify-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Official Student Registration Welcome Slip</span>
            </p>
          </div>
        </div>

        {/* Student Identification Box */}
        <div className="p-6 rounded-xl bg-secondary border border-border text-center space-y-3">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Student Full Name
            </span>
            <h2 className="text-2xl font-bold text-foreground">
              {fullName}
            </h2>
          </div>
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
              Assigned Student ID
            </span>
            <span className="text-3xl font-mono font-extrabold text-foreground tracking-wider inline-block mt-1">
              {sId}
            </span>
          </div>
        </div>

        {/* Portal Access Instructions */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Student Portal Access Information
          </h3>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold">Portal Login URL:</span>
              <span className="font-mono text-primary select-all">{loginUrl}</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed pt-1">
              Log in with your Student ID and the password you chose at registration. You can change it in My Profile.
            </p>
            <p className="text-[11px] text-muted-foreground italic pt-1">
              Notice: For security reasons, your chosen password is not printed on this slip.
            </p>
          </div>
        </div>

        {/* Registration Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Registration Date</span>
            </span>
            <span className="font-semibold text-foreground block">
              {regDate
                ? new Date(regDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span>Receptionist / Registrar</span>
            </span>
            <span className="font-semibold text-foreground block">
              {receptionistName}
            </span>
          </div>
        </div>

        {/* Verification & Signature Section */}
        <div className="pt-8 grid grid-cols-2 gap-8 border-t border-border text-center text-xs">
          <div className="space-y-10">
            <div className="border-b border-border w-40 mx-auto" />
            <span className="text-[11px] font-medium text-muted-foreground block">
              Receptionist Signature & Stamp
            </span>
          </div>
          <div className="space-y-10">
            <div className="border-b border-border w-40 mx-auto" />
            <span className="text-[11px] font-medium text-muted-foreground block">
              Student Signature
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 text-[10px] text-muted-foreground border-t border-border">
          Omishtu-Joy Training Center &bull; Operational Hub & Reception Desk
        </div>
      </div>
    </div>
  );
};
