import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import {
  listStudentsApi,
  getStudentStatsApi,
  createStudentApi,
  updateStudentStatusApi,
} from '../../api/students.js';
import {
  StudentRecord,
  StudentStats,
} from '../../types/students.js';
import { Card, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Badge } from '../../components/ui/badge.js';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Power,
  PowerOff,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
  EyeOff,
  GraduationCap,
} from 'lucide-react';

const addStudentSchema = z.object({
  studentCode: z
    .string()
    .trim()
    .min(3, 'Student ID must be at least 3 characters')
    .max(50, 'Student ID cannot exceed 50 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
});

export const StudentsPage: React.FC = () => {
  // Directory & Stats Data
  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addErrors, setAddErrors] = useState<{
    studentCode?: string;
    password?: string;
  }>({});

  // Confirm Status Change Modal State
  const [confirmStatusStudent, setConfirmStatusStudent] = useState<StudentRecord | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Fetch Students & Stats data
  const fetchStudentsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsResponse, statsData] = await Promise.all([
        listStudentsApi({
          search: searchQuery.trim() || undefined,
          status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined,
          page: currentPage,
          limit: 10,
        }),
        getStudentStatsApi(),
      ]);

      setStudentsList(studentsResponse.students);
      setTotalStudents(studentsResponse.total);
      setTotalPages(studentsResponse.totalPages);
      setStats(statsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students data');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatusFilter, currentPage]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  // Handle Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddErrors({});

    const validation = addStudentSchema.safeParse({
      studentCode: studentCode.trim(),
      password, // Password is never trimmed
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setAddErrors(fieldErrors);
      return;
    }

    setAddSubmitting(true);
    try {
      await createStudentApi({
        studentCode: studentCode.trim().toUpperCase(),
        password,
      });

      setShowAddModal(false);
      setStudentCode('');
      setPassword('');
      setShowPassword(false);
      setAddErrors({});
      setAddError(null);

      fetchStudentsData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
        if (axiosError.response?.status === 409) {
          setAddErrors({ studentCode: 'A student with this Student ID already exists' });
        } else {
          setAddError(axiosError.response?.data?.error?.message || 'Failed to add student');
        }
      } else if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError('An unexpected error occurred while adding student');
      }
    } finally {
      setAddSubmitting(false);
    }
  };

  // Handle Toggle Active / Deactivate
  const handleExecuteStatusToggle = async () => {
    if (!confirmStatusStudent) return;

    setStatusSubmitting(true);
    setActionId(confirmStatusStudent.id);
    try {
      await updateStudentStatusApi(confirmStatusStudent.id, !confirmStatusStudent.isActive);
      setConfirmStatusStudent(null);
      fetchStudentsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update student status';
      alert(msg);
    } finally {
      setStatusSubmitting(false);
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with 'Add student' button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Students
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Student directory, identity management, and credential provisioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudentsData}
            disabled={loading}
            className="rounded-full gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => {
              setAddError(null);
              setAddErrors({});
              setStudentCode('');
              setPassword('');
              setShowPassword(false);
              setShowAddModal(true);
            }}
            className="rounded-full gap-2 text-xs font-semibold shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add student</span>
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Students */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Students
                </p>
                {loading ? (
                  <div className="h-9 w-16 mt-2 rounded bg-muted animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-foreground mt-2">
                    {stats?.totalStudents ?? 0}
                  </h3>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Active Students
                </p>
                {loading ? (
                  <div className="h-9 w-16 mt-2 rounded bg-muted animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-foreground mt-2">
                    {stats?.activeStudents ?? 0}
                  </h3>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Students */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Inactive Students
                </p>
                {loading ? (
                  <div className="h-9 w-16 mt-2 rounded bg-muted animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-foreground mt-2">
                    {stats?.inactiveStudents ?? 0}
                  </h3>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserX className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Students Directory Card */}
      <Card className="shadow-sm border-border bg-card">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-border bg-secondary/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search students by Student ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs bg-card"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <AlertCircle className="h-6 w-6 text-primary mx-auto" />
              <p className="font-medium text-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchStudentsData}>
                Retry
              </Button>
            </div>
          ) : studentsList.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No students yet
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase font-semibold text-secondary-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-6">Student ID</th>
                      <th className="py-3 px-6">Portal Access</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Last Login</th>
                      <th className="py-3 px-6">Registered On</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentsList.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3.5 px-6 font-semibold font-mono text-foreground text-xs">
                          {item.studentCode}
                        </td>

                        <td className="py-3.5 px-6">
                          <Badge variant="outline" className="text-xs font-medium bg-card text-foreground">
                            Student Portal
                          </Badge>
                        </td>

                        <td className="py-3.5 px-6">
                          {item.isActive ? (
                            <Badge variant="outline" className="text-xs bg-card text-primary border-primary/30 font-semibold">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs font-semibold">
                              Inactive
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-xs text-muted-foreground">
                          {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : 'Never'}
                        </td>

                        <td className="py-3.5 px-6 text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={actionId === item.id}
                            title={item.isActive ? 'Deactivate student' : 'Activate student'}
                            onClick={() => setConfirmStatusStudent(item)}
                            className={`h-8 px-2.5 text-xs ${
                              item.isActive
                                ? 'text-destructive hover:bg-secondary'
                                : 'text-primary hover:bg-secondary'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <PowerOff className="h-3.5 w-3.5 mr-1" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Power className="h-3.5 w-3.5 mr-1" />
                                <span>Activate</span>
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div>
                  Showing <span className="font-semibold text-foreground">{studentsList.length}</span> of{' '}
                  <span className="font-semibold text-foreground">{totalStudents}</span> students
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 text-xs gap-1 rounded-md"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </Button>

                  <span className="px-2 font-medium text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || loading}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 text-xs gap-1 rounded-md"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. 'Add student' Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    Add student
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Register a new student account for portal access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {addError && (
                <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Student ID */}
              <div className="space-y-1.5">
                <Label htmlFor="add-student-code" className="text-xs font-semibold text-foreground">
                  Student ID Number
                </Label>
                <Input
                  id="add-student-code"
                  type="text"
                  placeholder="E.g. STD-2026-001"
                  value={studentCode}
                  onChange={(e) => {
                    setStudentCode(e.target.value);
                    setAddErrors((prev) => ({ ...prev, studentCode: undefined }));
                  }}
                  disabled={addSubmitting}
                  className="font-mono"
                  required
                />
                {addErrors.studentCode && (
                  <p className="text-[11px] text-destructive font-medium">{addErrors.studentCode}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="add-student-password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="add-student-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (min. 8 characters)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAddErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={addSubmitting}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {addErrors.password && (
                  <p className="text-[11px] text-destructive font-medium">{addErrors.password}</p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  disabled={addSubmitting}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSubmitting}
                  className="rounded-full text-xs font-semibold"
                >
                  {addSubmitting ? 'Adding student...' : 'Add student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Confirmation Dialog: Activate / Deactivate */}
      {confirmStatusStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {confirmStatusStudent.isActive ? 'Deactivate student' : 'Activate student'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Confirmation required
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              {confirmStatusStudent.isActive ? (
                <>
                  Are you sure you want to deactivate student{' '}
                  <span className="font-semibold text-primary font-mono">{confirmStatusStudent.studentCode}</span>?
                  They will no longer be able to log in to the student portal.
                </>
              ) : (
                <>
                  Are you sure you want to activate student{' '}
                  <span className="font-semibold text-primary font-mono">{confirmStatusStudent.studentCode}</span>?
                  They will be permitted to access the student portal.
                </>
              )}
            </p>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmStatusStudent(null)}
                disabled={statusSubmitting}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteStatusToggle}
                disabled={statusSubmitting}
                variant={confirmStatusStudent.isActive ? 'destructive' : 'default'}
                className="rounded-full text-xs font-semibold"
              >
                {statusSubmitting
                  ? 'Updating...'
                  : confirmStatusStudent.isActive
                  ? 'Deactivate'
                  : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
