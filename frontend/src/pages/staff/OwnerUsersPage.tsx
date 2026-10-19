import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth.js';
import {
  listStaffApi,
  getStaffStatsApi,
  listRolesApi,
  createStaffApi,
  updateStaffApi,
  resetStaffPasswordApi,
} from '../../api/users.js';
import {
  StaffMemberRecord,
  StaffRole,
  StaffStats,
  RoleRecord,
} from '../../types/auth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Badge } from '../../components/ui/badge.js';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Power,
  PowerOff,
  AlertCircle,
  X,
  Edit,
  ShieldCheck,
} from 'lucide-react';

const ASSIGNABLE_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'receptionist', label: 'Front Desk Receptionist' },
  { value: 'academic_admin', label: 'Academic Administrator' },
  { value: 'trainer', label: 'Course Trainer' },
  { value: 'accountant', label: 'Finance & Accountant' },
  { value: 'manager', label: 'Operations Manager' },
];

const newStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['receptionist', 'academic_admin', 'trainer', 'accountant', 'manager'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

export const OwnerUsersPage: React.FC = () => {
  const { user: currentOwner } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

  // Directory & Stats Data
  const [staffList, setStaffList] = useState<StaffMemberRecord[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('trainer');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Role Modal State
  const [editingStaff, setEditingStaff] = useState<StaffMemberRecord | null>(null);
  const [newRoleForStaff, setNewRoleForStaff] = useState<StaffRole>('trainer');
  const [editRoleSubmitting, setEditRoleSubmitting] = useState(false);

  // Temporary Password Modal State (for both create & reset)
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    staffName: string;
    staffEmail: string;
    tempPassword: string;
    actionType: 'created' | 'reset';
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // In-flight Action Lock
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffData, statsData, rolesData] = await Promise.all([
        listStaffApi(),
        getStaffStatsApi(),
        listRolesApi().catch(() => [
          { id: 'role-owner', name: 'owner' as StaffRole, display_name: 'Center Owner', description: 'Full administrative authority and financial governance' },
          { id: 'role-manager', name: 'manager' as StaffRole, display_name: 'Operations Manager', description: 'Operational oversight, schedule sign-off, and staff management' },
          { id: 'role-academic-admin', name: 'academic_admin' as StaffRole, display_name: 'Academic Administrator', description: 'Course catalog, cohorts, timetable planning, and graduation' },
          { id: 'role-trainer', name: 'trainer' as StaffRole, display_name: 'Course Trainer / Instructor', description: 'Class attendance, assessments, and student performance grading' },
          { id: 'role-accountant', name: 'accountant' as StaffRole, display_name: 'Finance & Accountant', description: 'Tuition invoicing, payment cashiering, AR/AP, and bank reconciliation' },
          { id: 'role-receptionist', name: 'receptionist' as StaffRole, display_name: 'Front Desk / Receptionist', description: 'In-person student intake, inquiry logging, and credential issuance' },
        ]),
      ]);
      setStaffList(staffData);
      setStats(statsData);
      setRoles(rolesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staff management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create Staff
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const validation = newStaffSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: selectedRole,
    });

    if (!validation.success) {
      setCreateError(validation.error.errors[0]?.message || 'Validation error');
      return;
    }

    setCreateSubmitting(true);
    try {
      const result = await createStaffApi({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
      });

      setShowCreateModal(false);
      setFullName('');
      setEmail('');
      setSelectedRole('trainer');

      setTempPasswordModal({
        staffName: result.staff.fullName,
        staffEmail: result.staff.email,
        tempPassword: result.temporaryPassword,
        actionType: 'created',
      });

      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
        if (axiosError.response?.status === 409) {
          setCreateError('A staff member with this email address already exists.');
        } else {
          setCreateError(axiosError.response?.data?.error?.message || 'Failed to create staff member');
        }
      } else if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('An unexpected error occurred while creating staff member');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Toggle Active / Deactivate
  const handleToggleActive = async (staff: StaffMemberRecord) => {
    if (staff.id === currentOwner?.id) {
      alert('You cannot deactivate your own owner account.');
      return;
    }

    setActionId(staff.id);
    try {
      const updated = await updateStaffApi(staff.id, { isActive: !staff.isActive });
      setStaffList((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
      // Refresh stats
      getStaffStatsApi().then(setStats).catch(() => {});
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update account status');
    } finally {
      setActionId(null);
    }
  };

  // Handle Reset Password Action
  const handleResetPassword = async (staff: StaffMemberRecord) => {
    if (!confirm(`Generate a new temporary password for ${staff.fullName}?`)) {
      return;
    }

    setActionId(staff.id);
    try {
      const result = await resetStaffPasswordApi(staff.id);
      setTempPasswordModal({
        staffName: staff.fullName,
        staffEmail: staff.email,
        tempPassword: result.temporaryPassword,
        actionType: 'reset',
      });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setActionId(null);
    }
  };

  // Handle Edit Role Action
  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (editingStaff.id === currentOwner?.id) {
      alert('You cannot change or demote your own owner role.');
      return;
    }

    setEditRoleSubmitting(true);
    try {
      const updated = await updateStaffApi(editingStaff.id, { role: newRoleForStaff });
      setStaffList((prev) => prev.map((s) => (s.id === editingStaff.id ? updated : s)));
      setEditingStaff(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update staff role');
    } finally {
      setEditRoleSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPasswordModal) {
      navigator.clipboard.writeText(tempPasswordModal.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with 'New staff' button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Users &amp; Roles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage training center personnel, provision accounts, and inspect operational roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-full gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="rounded-full gap-2 text-xs font-semibold shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>New staff</span>
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards: Total, Active, Inactive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Staff
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.totalStaff ?? staffList.length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Active
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.activeStaff ?? staffList.filter((s) => s.isActive).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Inactive
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.inactiveStaff ?? staffList.filter((s) => !s.isActive).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserX className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabs: Staff | Roles */}
      <Card className="shadow-sm border-border bg-card">
        <div className="border-b border-border px-6 pt-4 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'staff'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Staff Directory ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Roles &amp; Permissions ({roles.length})
          </button>
        </div>

        <CardContent className="p-0">
          {activeTab === 'staff' ? (
            /* Staff Table */
            loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading staff records...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <AlertCircle className="h-6 w-6 text-primary mx-auto" />
                <p>{error}</p>
                <Button size="sm" variant="outline" onClick={fetchData}>
                  Retry
                </Button>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No staff members found. Click &quot;New staff&quot; to provision an account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase font-semibold text-secondary-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Email</th>
                      <th className="py-3 px-6">Role</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Last Login</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {staffList.map((staff) => {
                      const isSelf = staff.id === currentOwner?.id;
                      return (
                        <tr key={staff.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <span>{staff.fullName}</span>
                              {isSelf && (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold text-primary">
                                  You
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-xs text-muted-foreground font-mono">
                            {staff.email}
                          </td>

                          <td className="py-3.5 px-6">
                            <Badge variant="outline" className="text-xs capitalize font-medium bg-card text-foreground">
                              {staff.role.replace('_', ' ')}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-6">
                            {staff.isActive ? (
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
                            {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : 'Never'}
                          </td>

                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Role */}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isSelf || actionId === staff.id}
                                title={isSelf ? 'Cannot edit own role' : 'Edit Role'}
                                onClick={() => {
                                  setEditingStaff(staff);
                                  setNewRoleForStaff(staff.role as StaffRole);
                                }}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                <span>Role</span>
                              </Button>

                              {/* Reset Password */}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionId === staff.id}
                                title="Reset Temporary Password"
                                onClick={() => handleResetPassword(staff)}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                              >
                                <KeyRound className="h-3.5 w-3.5 mr-1" />
                                <span>Reset</span>
                              </Button>

                              {/* Activate / Deactivate Toggle */}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isSelf || actionId === staff.id}
                                title={isSelf ? 'Cannot deactivate yourself' : staff.isActive ? 'Deactivate staff' : 'Activate staff'}
                                onClick={() => handleToggleActive(staff)}
                                className={`h-8 px-2 text-xs ${
                                  staff.isActive
                                    ? 'text-destructive hover:bg-secondary'
                                    : 'text-primary hover:bg-secondary'
                                }`}
                              >
                                {staff.isActive ? (
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Roles List (Read-Only) */
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-bold text-foreground capitalize">
                      {r.display_name}
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-card text-muted-foreground">
                    Code: {r.name}
                  </Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {r.description || 'System authority role'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. 'New staff' Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    Provision New Staff Member
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generates a temporary password with mandatory password reset
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="create-full-name" className="text-xs font-semibold text-foreground">
                  Full Name
                </Label>
                <Input
                  id="create-full-name"
                  type="text"
                  placeholder="e.g. Maria Gonzalez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={createSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-email" className="text-xs font-semibold text-foreground">
                  Staff Email Address
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="maria@omishtu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-role" className="text-xs font-semibold text-foreground">
                  Operational Staff Role
                </Label>
                <select
                  id="create-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                  disabled={createSubmitting}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-medium"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  * Owner role cannot be provisioned or selected.
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-full text-xs font-semibold"
                >
                  {createSubmitting ? 'Provisioning...' : 'Provision Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Role Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Change Staff Role
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update role for {editingStaff.fullName}
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditRoleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-role-select" className="text-xs font-semibold text-foreground">
                  Select New Role
                </Label>
                <select
                  id="edit-role-select"
                  value={newRoleForStaff}
                  onChange={(e) => setNewRoleForStaff(e.target.value as StaffRole)}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-medium"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStaff(null)}
                  disabled={editRoleSubmitting}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editRoleSubmitting}
                  className="rounded-full text-xs font-semibold"
                >
                  {editRoleSubmitting ? 'Updating...' : 'Save Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Single-Use Temporary Password Modal */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-primary/40 shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 text-primary">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {tempPasswordModal.actionType === 'created'
                    ? 'Staff Account Provisioned'
                    : 'Temporary Password Reset'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Credentials for {tempPasswordModal.staffName} ({tempPasswordModal.staffEmail})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/80 border border-border space-y-2">
              <span className="text-xs font-semibold text-secondary-foreground block uppercase tracking-wider">
                Temporary Password:
              </span>
              <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
                <span className="font-mono text-base font-bold text-foreground tracking-wider select-all">
                  {tempPasswordModal.tempPassword}
                </span>
                <Button
                  size="sm"
                  onClick={handleCopyPassword}
                  className="rounded-full gap-1.5 text-xs font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-primary">Security Warning:</p>
              <p>
                &bull; This temporary password will be <strong>shown only once</strong>.
              </p>
              <p>
                &bull; The staff member must change this password immediately upon their first login.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setTempPasswordModal(null)}
                className="rounded-full text-xs font-semibold px-6"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
