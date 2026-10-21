import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listStudentsApi,
  getStudentStatsApi,
} from '../../api/students.js';
import {
  StudentRecord,
  StudentStats,
} from '../../types/students.js';
import { Card, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Badge } from '../../components/ui/badge.js';
import {
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export const StudentListPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, statsRes] = await Promise.all([
        listStudentsApi({
          search: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: currentPage,
          limit: 10,
        }),
        getStudentStatsApi().catch(() => null),
      ]);

      setStudents(res.students);
      setTotalStudents(res.total);
      setTotalPages(res.totalPages);
      if (statsRes) setStats(statsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleCopy = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Student Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Registered students directory, intake profiles, and ID credentials
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link to="/staff/reception/students/new">
            <Button size="sm" className="flex items-center gap-1.5 rounded-lg text-xs font-semibold">
              <UserPlus className="h-4 w-4" />
              <span>Register student</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Total Registered</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.totalStudents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Active Students</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.activeStudents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Inactive Records</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.inactiveStudents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, student ID, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground font-medium">Status:</span>
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary text-xs">
                {(['all', 'active', 'inactive'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setStatusFilter(filter);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                      statusFilter === filter
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Students Data Table */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary text-muted-foreground font-semibold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm font-semibold text-foreground">No students found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery
                        ? 'Try adjusting your search criteria or clear filters.'
                        : 'No student accounts have been registered yet.'}
                    </p>
                    {!searchQuery && (
                      <Link to="/staff/reception/students/new" className="inline-block mt-4">
                        <Button size="sm" className="rounded-lg text-xs font-semibold">
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          <span>Register first student</span>
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const sId = student.studentCode || student.student_code || '—';
                  const sName = student.fullName || student.full_name || (
                    student.firstName || student.first_name
                      ? `${student.firstName || student.first_name} ${student.lastName || student.last_name || ''}`.trim()
                      : sId
                  );
                  const phoneNum = student.phone || '—';
                  const regDate = student.registeredAt || student.registered_at || student.createdAt || student.created_at;
                  const isActive = student.isActive ?? student.is_active ?? true;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/staff/reception/students/${student.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{sId}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(sId);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Student ID"
                          >
                            {copiedId === sId ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {sName}
                        </span>
                        {student.email && (
                          <span className="block text-[11px] text-muted-foreground">{student.email}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono">
                        {phoneNum}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {regDate
                          ? new Date(regDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold py-0.5 px-2 ${
                            isActive
                              ? 'bg-card text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/staff/reception/students/${student.id}/slip`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              title="Print Welcome Slip"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link to={`/staff/reception/students/${student.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs font-medium"
                            >
                              <Eye className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>View</span>
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (10 per page) */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {students.length === 0 ? 0 : (currentPage - 1) * 10 + 1} to{' '}
            {Math.min(currentPage * 10, totalStudents)} of {totalStudents} students
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-md"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              <span>Previous</span>
            </Button>
            <span className="px-2 font-medium text-foreground">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 px-2.5 rounded-md"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
