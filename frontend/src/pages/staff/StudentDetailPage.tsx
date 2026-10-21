import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentByIdApi } from '../../api/students.js';
import { StudentRecord } from '../../types/students.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  Printer,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
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

  const handleCopyId = () => {
    const sId = student?.studentCode || student?.student_code;
    if (sId) {
      navigator.clipboard.writeText(sId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-32 bg-card border border-border rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-card border border-border rounded-xl" />
          <div className="h-48 bg-card border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Student Record Not Found</h2>
        <p className="text-xs text-muted-foreground">{error || 'The requested student could not be located.'}</p>
        <Link to="/staff/reception/students">
          <Button size="sm" variant="outline" className="rounded-full text-xs">
            Back to Student List
          </Button>
        </Link>
      </div>
    );
  }

  const sId = student.studentCode || student.student_code || '—';
  const firstName = student.firstName || student.first_name || '';
  const lastName = student.lastName || student.last_name || '';
  const fullName = student.fullName || student.full_name || `${firstName} ${lastName}`.trim() || sId;
  const contacts = student.emergencyContacts || student.emergency_contacts || [];
  const isActive = student.isActive ?? student.is_active ?? true;
  const mustReset = student.mustResetPassword ?? student.must_reset_password ?? false;
  const regDate = student.registeredAt || student.registered_at || student.createdAt || student.created_at;
  const staffName = student.registeredByStaffName || student.registered_by_staff_name || 'Front Desk Staff';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/staff/reception/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to student list</span>
        </Link>
        <Link to={`/staff/reception/students/${student.id}/slip`}>
          <Button size="sm" className="rounded-full text-xs font-semibold flex items-center gap-1.5 px-4">
            <Printer className="h-3.5 w-3.5" />
            <span>Print welcome slip</span>
          </Button>
        </Link>
      </div>

      {/* Header Profile Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xl border border-border shadow-inner">
                {firstName ? firstName[0].toUpperCase() : 'S'}
                {lastName ? lastName[0].toUpperCase() : ''}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-secondary px-2.5 py-0.5 rounded-md border border-border text-xs font-mono font-medium text-foreground">
                    <IdCard className="h-3.5 w-3.5 text-primary" />
                    <span>{sId}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Student ID"
                    >
                      {copiedId ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold py-0.5 px-2 ${
                      isActive ? 'bg-card text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isActive ? 'Active Student' : 'Inactive'}
                  </Badge>
                  {mustReset && (
                    <Badge variant="outline" className="text-[10px] bg-secondary text-primary">
                      First Password Reset Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {regDate && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 sm:self-start">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Registered:{' '}
                  {new Date(regDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Personal Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground font-medium block">First Name</span>
                <span className="font-semibold text-foreground">{firstName || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">Last Name</span>
                <span className="font-semibold text-foreground">{lastName || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">Gender</span>
                <span className="font-semibold text-foreground capitalize">{student.gender || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">Date of Birth</span>
                <span className="font-semibold text-foreground">{student.dateOfBirth || student.date_of_birth || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3.5">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Contact Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-semibold font-mono text-foreground">{student.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold text-foreground">{student.email || 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground">Address:</span>
                <span className="font-semibold text-foreground">
                  {[student.address, student.city].filter(Boolean).join(', ') || 'None'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-3.5">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Emergency Contact(s)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Contact persons designated during in-person registration
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No emergency contacts recorded.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {contacts.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="p-3.5 rounded-xl border border-border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {contact.fullName || contact.full_name}
                    </span>
                    {(contact.isPrimary ?? contact.is_primary) ? (
                      <Badge variant="outline" className="text-[10px] bg-secondary text-primary font-semibold">
                        Primary
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      Relationship: <strong className="text-foreground">{contact.relationship}</strong>
                    </div>
                    <div className="font-mono text-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 text-primary" />
                      <span>{contact.phone}</span>
                    </div>
                    {(contact.alternatePhone || contact.alternate_phone) && (
                      <div className="font-mono text-[11px]">
                        Alt: {contact.alternatePhone || contact.alternate_phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration & Audit Metadata */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Registration & Intake Audit
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Registered By Staff</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>{staffName}</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Registration Date & Time</span>
              <span className="font-semibold text-foreground">
                {regDate ? new Date(regDate).toLocaleString() : '—'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Password Policy Status</span>
              <span className="font-semibold text-foreground">
                {mustReset ? 'First Login Reset Required' : 'Active / Password Established'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
