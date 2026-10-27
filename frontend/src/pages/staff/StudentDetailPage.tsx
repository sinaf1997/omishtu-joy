import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getStudentByIdApi } from '../../api/students.js';
import {
  getStudentEnrollmentsApi,
  removeWaitlistEntryApi,
} from '../../api/enrollments.js';
import { StudentRecord } from '../../types/students.js';
import { StudentEnrollmentItem, StudentWaitlistItem } from '../../types/enrollments.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';
import { CourseTypeBadge } from '../../components/academics/CourseTypeBadge.js';
import { EnrollmentStatusBadge } from '../../components/academics/EnrollmentStatusBadge.js';
import { EnrollmentSourceBadge } from '../../components/academics/EnrollmentSourceBadge.js';
import { EnrollStudentModal } from '../../components/academics/EnrollStudentModal.js';
import { DropEnrollmentModal } from '../../components/academics/DropEnrollmentModal.js';
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
  BookOpen,
  ListOrdered,
  Plus,
  Loader2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const canManageEnrollments =
    user?.role === 'owner' ||
    user?.role === 'manager' ||
    user?.role === 'academic_admin' ||
    user?.role === 'receptionist';

  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Active tab: 'profile' | 'enrollments'
  const [activeTab, setActiveTab] = useState<'profile' | 'enrollments'>('profile');

  // Enrollments data
  const [enrollments, setEnrollments] = useState<StudentEnrollmentItem[]>([]);
  const [waitlist, setWaitlist] = useState<StudentWaitlistItem[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; courseTitle: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!id) return;
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
  }, [id]);

  const fetchEnrollments = useCallback(async () => {
    if (!id) return;
    setLoadingEnrollments(true);
    try {
      const data = await getStudentEnrollmentsApi(id);
      setEnrollments(data.enrollments || []);
      setWaitlist(data.waitlist || []);
    } catch (err) {
      console.error('Failed to load student enrollments:', err);
    } finally {
      setLoadingEnrollments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
    fetchEnrollments();
  }, [fetchStudent, fetchEnrollments]);

  const handleCopyId = () => {
    const sId = student?.studentCode || student?.student_code;
    if (sId) {
      navigator.clipboard.writeText(sId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleRemoveWaitlist = async (waitlistEntryId: string) => {
    setActionError(null);
    try {
      await removeWaitlistEntryApi(waitlistEntryId, 'Student left waitlist');
      await fetchEnrollments();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to remove waitlist entry'
      );
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

  const activeEnrollmentsCount = enrollments.filter((e) => e.status === 'active').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back button & Slip action */}
      <div className="flex items-center justify-between">
        <Link
          to="/staff/reception/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Students</span>
        </Link>
        <div className="flex items-center gap-2">
          {canManageEnrollments && (
            <Button
              size="sm"
              onClick={() => setIsEnrollModalOpen(true)}
              className="gap-1.5 text-xs rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Enroll in Course
            </Button>
          )}
          <Link to={`/staff/reception/students/${student.id}/slip`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-lg border-border">
              <Printer className="h-3.5 w-3.5 text-primary" />
              Print Registration Slip
            </Button>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Student Header Card */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase shadow-sm">
              {firstName.charAt(0)}
              {lastName.charAt(0) || firstName.charAt(1) || 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{fullName}</h1>
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={isActive ? 'bg-primary/15 text-primary border border-primary/30 text-xs' : 'text-xs'}
                >
                  {isActive ? 'Active Student' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono bg-muted/60 px-2 py-0.5 rounded border border-border font-bold text-foreground">
                  {sId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="hover:text-primary transition-colors p-1"
                  title="Copy Student ID"
                  aria-label="Copy Student ID"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="border-t border-border px-6">
          <nav className="flex space-x-6" aria-label="Student Navigation">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile & Emergency Contacts
            </button>

            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'enrollments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Course Enrollments
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-muted text-[10px] text-foreground font-bold">
                {activeEnrollmentsCount}
              </span>
              {waitlist.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-warning/20 text-warning text-[10px] font-bold">
                  {waitlist.length} waiting
                </span>
              )}
            </button>
          </nav>
        </div>
      </Card>

      {/* TAB 1: Profile & Emergency Contacts */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
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
      )}

      {/* TAB 2: Course Enrollments & Waitlist */}
      {activeTab === 'enrollments' && (
        <div className="space-y-6">
          {/* Active / Past Enrollments Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-3.5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Course Enrollments ({enrollments.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Record of all major and elective enrollments for this student
                </CardDescription>
              </div>
              {canManageEnrollments && (
                <Button
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="gap-1.5 text-xs rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Enroll in Course
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {loadingEnrollments ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground">No course enrollments yet</p>
                  <p className="text-xs text-muted-foreground">
                    This student is not actively enrolled in any courses.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Course</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Weekly Schedule</th>
                        <th className="py-2.5 px-3">Enrolled Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        {canManageEnrollments && <th className="py-2.5 px-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {enrollments.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3">
                            <Link
                              to={`/staff/academics/courses/${item.course_id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <span>[{item.course_code}] {item.course_title}</span>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            </Link>
                            <span className="text-[11px] text-muted-foreground">
                              {item.start_date} to {item.end_date}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <CourseTypeBadge type={item.course_type} />
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {item.slot_summary}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {item.enrolled_at ? item.enrolled_at.substring(0, 10) : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <EnrollmentStatusBadge status={item.status} />
                              {item.status === 'dropped' && item.drop_reason && (
                                <p className="text-[10px] text-muted-foreground italic">
                                  Reason: {item.drop_reason}
                                </p>
                              )}
                            </div>
                          </td>
                          {canManageEnrollments && (
                            <td className="py-3 px-3 text-right">
                              {item.status === 'active' && (
                                <button
                                  onClick={() => setDropTarget({ id: item.id, courseTitle: `[${item.course_code}] ${item.course_title}` })}
                                  className="text-xs font-medium text-destructive hover:underline"
                                >
                                  Drop
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waitlist Entries Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-3.5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-warning" />
                Waitlist Queue ({waitlist.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Courses where this student is currently waiting for open capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingEnrollments ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : waitlist.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  Not on any course waitlists.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Queue #</th>
                        <th className="py-2.5 px-3">Course</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Joined Date</th>
                        {canManageEnrollments && <th className="py-2.5 px-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {waitlist.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning/15 text-warning font-bold text-xs">
                              #{item.position}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Link
                              to={`/staff/academics/courses/${item.course_id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <span>[{item.course_code}] {item.course_title}</span>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            </Link>
                          </td>
                          <td className="py-3 px-3">
                            <CourseTypeBadge type={item.course_type} />
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {item.joined_at ? item.joined_at.substring(0, 10) : '—'}
                          </td>
                          {canManageEnrollments && (
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleRemoveWaitlist(item.id)}
                                className="text-xs font-medium text-destructive hover:underline"
                              >
                                Leave Waitlist
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enroll Student Modal */}
      {isEnrollModalOpen && (
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          initialStudentId={student.id}
          initialStudentName={fullName}
          onSuccess={() => {
            fetchEnrollments();
          }}
        />
      )}

      {/* Drop Enrollment Modal */}
      {dropTarget && (
        <DropEnrollmentModal
          isOpen={!!dropTarget}
          onClose={() => setDropTarget(null)}
          enrollmentId={dropTarget.id}
          studentName={fullName}
          courseTitle={dropTarget.courseTitle}
          onSuccess={() => {
            fetchEnrollments();
          }}
        />
      )}
    </div>
  );
};
