import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth.js';
import {
  listUsersApi,
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
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react';

const ASSIGNABLE_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'receptionist', label: 'Front Desk Receptionist' },
  { value: 'academic_admin', label: 'Academic Administrator' },
  { value: 'trainer', label: 'Course Trainer' },
  { value: 'accountant', label: 'Finance & Accountant' },
  { value: 'manager', label: 'Operations Manager' },
];

const cleanPhone = (val: string) => val.replace(/[\s-]/g, '');
const isPhoneValid = (val: string) => {
  if (!val) return true;
  if (!/^\+?[0-9\s-]+$/.test(val)) return false;
  const digits = cleanPhone(val).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 20;
};

const addUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name cannot exceed 150 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isPhoneValid(val), {
      message: 'Phone must contain 7 to 20 digits (optional leading +, spaces, dashes)',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['receptionist', 'academic_admin', 'trainer', 'accountant', 'manager'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

export const OwnerUsersPage: React.FC = () => {
  const { user: currentOwner } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // Directory & Stats Data
  const [usersList, setUsersList] = useState<StaffMemberRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole>('trainer');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addErrors, setAddErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
  }>({});

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<StaffMemberRecord | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<StaffRole>('trainer');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<{
    fullName?: string;
    phone?: string;
    role?: string;
  }>({});

  // Confirm Status Change (Activate / Deactivate) Modal State
  const [confirmStatusUser, setConfirmStatusUser] = useState<StaffMemberRecord | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Confirm Password Reset Modal State
  const [confirmResetUser, setConfirmResetUser] = useState<StaffMemberRecord | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Temporary Password Modal State (for both create & reset)
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    userName: string;
    userEmail: string;
    tempPassword: string;
    actionType: 'created' | 'reset';
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // In-flight Action Lock
  const [actionId, setActionId] = useState<string | null>(null);

  // Fetch Users & Roles data
  const fetchUsersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, statsData, rolesData] = await Promise.all([
        listUsersApi({
          search: searchQuery.trim() || undefined,
          role: selectedRoleFilter !== 'all' ? selectedRoleFilter : undefined,
          status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined,
          page: currentPage,
          limit: 10,
        }),
        getStaffStatsApi(),
        listRolesApi(),
      ]);

      setUsersList(usersResponse.users);
      setTotalUsers(usersResponse.total);
      setTotalPages(usersResponse.totalPages);
      setStats(statsData);
      setRoles(rolesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users management data');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedRoleFilter, selectedStatusFilter, currentPage]);

  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // Handle Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddErrors({});

    const validation = addUserSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      password, // Password is never trimmed
      role: selectedRole,
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
      await createStaffApi({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? cleanPhone(phone.trim()) : null,
        password, // Password is never trimmed
        role: selectedRole,
      });

      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setSelectedRole('trainer');
      setAddErrors({});
      setAddError(null);

      fetchUsersData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
        if (axiosError.response?.status === 409) {
          setAddErrors({ email: 'A user with this email already exists' });
        } else {
          setAddError(axiosError.response?.data?.error?.message || 'Failed to add user');
        }
      } else if (err instanceof Error) {
        setAddError(err.message);
      } else {
        setAddError('An unexpected error occurred while adding user');
      }
    } finally {
      setAddSubmitting(false);
    }
  };

  // Handle Edit User Submit (name, phone & role)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditErrors({});

    if (editingUser.id === currentOwner?.id) {
      setEditError('You cannot change or demote your own owner role.');
      return;
    }

    if (editFullName.trim().length < 2) {
      setEditErrors({ fullName: 'Full name must be at least 2 characters long' });
      return;
    }

    if (editPhone.trim() && !isPhoneValid(editPhone.trim())) {
      setEditErrors({ phone: 'Phone must contain 7 to 20 digits (optional leading +, spaces, dashes)' });
      return;
    }

    setEditSubmitting(true);
    try {
      await updateStaffApi(editingUser.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim() ? cleanPhone(editPhone.trim()) : null,
        role: editRole,
      });

      setEditingUser(null);
      fetchUsersData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setEditError(axiosError.response?.data?.error?.message || 'Failed to update user');
      } else if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('An unexpected error occurred while updating user');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Toggle Active / Deactivate Confirmation
  const handleExecuteStatusToggle = async () => {
    if (!confirmStatusUser) return;

    if (confirmStatusUser.id === currentOwner?.id) {
      alert('You cannot deactivate your own owner account.');
      setConfirmStatusUser(null);
      return;
    }

    setStatusSubmitting(true);
    setActionId(confirmStatusUser.id);
    try {
      await updateStaffApi(confirmStatusUser.id, {
        isActive: !confirmStatusUser.isActive,
      });
      setConfirmStatusUser(null);
      fetchUsersData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user status';
      alert(msg);
    } finally {
      setStatusSubmitting(false);
      setActionId(null);
    }
  };

  // Handle Reset Password Confirmation
  const handleExecuteResetPassword = async () => {
    if (!confirmResetUser) return;

    setResetSubmitting(true);
    setActionId(confirmResetUser.id);
    try {
      const result = await resetStaffPasswordApi(confirmResetUser.id);
      const userRef = confirmResetUser;
      setConfirmResetUser(null);
      setTempPasswordModal({
        userName: userRef.fullName,
        userEmail: userRef.email,
        tempPassword: result.temporaryPassword,
        actionType: 'reset',
      });
      fetchUsersData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset user password';
      alert(msg);
    } finally {
      setResetSubmitting(false);
      setActionId(null);
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
      {/* 1. Header with 'Add user' button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Users &amp; Roles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage training center users, provision accounts, and inspect operational roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsersData}
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
              setFullName('');
              setEmail('');
              setPhone('');
              setPassword('');
              setShowPassword(false);
              setSelectedRole('trainer');
              setShowAddModal(true);
            }}
            className="rounded-full gap-2 text-xs font-semibold shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add user</span>
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards: Total, Active, Inactive from GET /api/users/stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Users
                </p>
                {loading ? (
                  <div className="h-9 w-16 mt-2 rounded bg-muted animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-foreground mt-2">
                    {stats?.totalStaff ?? 0}
                  </h3>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Active Users
                </p>
                {loading ? (
                  <div className="h-9 w-16 mt-2 rounded bg-muted animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-foreground mt-2">
                    {stats?.activeStaff ?? 0}
                  </h3>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Inactive Users
                </p>
                {loading ? (
                  <div className="h-9 w-16 mt-2 rounded bg-muted animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-foreground mt-2">
                    {stats?.inactiveStaff ?? 0}
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

      {/* 3. Tabs: Users Directory | Roles & Permissions */}
      <Card className="shadow-sm border-border bg-card">
        <div className="border-b border-border px-6 pt-4 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Users Directory ({totalUsers})
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

        {/* Search & Filters Bar (Only for Users tab) */}
        {activeTab === 'users' && (
          <div className="p-4 border-b border-border bg-secondary/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs bg-card"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => {
                    setSelectedRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Center Owner</option>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
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
          </div>
        )}

        <CardContent className="p-0">
          {activeTab === 'users' ? (
            /* Users Table */
            loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
                <AlertCircle className="h-6 w-6 text-primary mx-auto" />
                <p className="font-medium text-foreground">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchUsersData}>
                  Retry
                </Button>
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No users yet
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/60 text-xs uppercase font-semibold text-secondary-foreground border-b border-border">
                      <tr>
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-6">Email</th>
                        <th className="py-3 px-6">Phone</th>
                        <th className="py-3 px-6">Role</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Last Login</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usersList.map((userItem) => {
                        const isSelf = userItem.id === currentOwner?.id;
                        return (
                          <tr key={userItem.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <span>{userItem.fullName}</span>
                                {isSelf && (
                                  <Badge variant="secondary" className="text-[10px] uppercase font-bold text-primary">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-6 text-xs text-muted-foreground font-mono">
                              {userItem.email}
                            </td>

                            <td className="py-3.5 px-6 text-xs text-muted-foreground font-mono">
                              {userItem.phone || '—'}
                            </td>

                            <td className="py-3.5 px-6">
                              <Badge variant="outline" className="text-xs capitalize font-medium bg-card text-foreground">
                                {userItem.role.replace('_', ' ')}
                              </Badge>
                            </td>

                            <td className="py-3.5 px-6">
                              {userItem.isActive ? (
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
                              {userItem.lastLoginAt ? new Date(userItem.lastLoginAt).toLocaleString() : 'Never'}
                            </td>

                            <td className="py-3.5 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Edit User (Name, Phone & Role) */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isSelf || actionId === userItem.id}
                                  title={isSelf ? 'Cannot edit own account' : 'Edit user'}
                                  onClick={() => {
                                    setEditingUser(userItem);
                                    setEditFullName(userItem.fullName);
                                    setEditPhone(userItem.phone || '');
                                    setEditRole(userItem.role as StaffRole);
                                    setEditError(null);
                                    setEditErrors({});
                                  }}
                                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  <span>Edit</span>
                                </Button>

                                {/* Reset Password */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={actionId === userItem.id}
                                  title="Reset Temporary Password"
                                  onClick={() => setConfirmResetUser(userItem)}
                                  className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                                >
                                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                                  <span>Reset</span>
                                </Button>

                                {/* Activate / Deactivate Toggle */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isSelf || actionId === userItem.id}
                                  title={isSelf ? 'Cannot deactivate yourself' : userItem.isActive ? 'Deactivate user' : 'Activate user'}
                                  onClick={() => setConfirmStatusUser(userItem)}
                                  className={`h-8 px-2 text-xs ${
                                    userItem.isActive
                                      ? 'text-destructive hover:bg-secondary'
                                      : 'text-primary hover:bg-secondary'
                                  }`}
                                >
                                  {userItem.isActive ? (
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

                {/* Pagination Controls */}
                <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div>
                    Showing <span className="font-semibold text-foreground">{usersList.length}</span> of{' '}
                    <span className="font-semibold text-foreground">{totalUsers}</span> users
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
            )
          ) : (
            /* Roles Tab from GET /api/roles */
            loading ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted/60 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
                <AlertCircle className="h-6 w-6 text-primary mx-auto" />
                <p className="font-medium text-foreground">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchUsersData}>
                  Retry
                </Button>
              </div>
            ) : roles.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No roles available
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-bold text-foreground capitalize">
                          {r.display_name}
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold bg-card text-primary border-primary/30">
                        {r.user_count ?? r.userCount ?? 0} {((r.user_count ?? r.userCount ?? 0) === 1) ? 'user' : 'users'}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase bg-card text-muted-foreground">
                      Code: {r.name}
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {r.description || 'Standard operational authority tier'}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* 4. 'Add user' Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    Add new user
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Grant dashboard access to a team member.
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

              {/* 1. Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="add-full-name" className="text-xs font-semibold text-foreground">
                  Full Name
                </Label>
                <Input
                  id="add-full-name"
                  type="text"
                  placeholder="E.g. Samuel Green"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setAddErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  disabled={addSubmitting}
                  required
                />
                {addErrors.fullName && (
                  <p className="text-[11px] text-destructive font-medium">{addErrors.fullName}</p>
                )}
              </div>

              {/* 2. Email */}
              <div className="space-y-1.5">
                <Label htmlFor="add-email" className="text-xs font-semibold text-foreground">
                  Email
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="E.g. samuel@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAddErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  disabled={addSubmitting}
                  required
                />
                {addErrors.email && (
                  <p className="text-[11px] text-destructive font-medium">{addErrors.email}</p>
                )}
              </div>

              {/* 3. Phone (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="add-phone" className="text-xs font-semibold text-foreground">
                  Phone <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="add-phone"
                  type="text"
                  placeholder="E.g. +251 91 234 5678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setAddErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  disabled={addSubmitting}
                />
                {addErrors.phone && (
                  <p className="text-[11px] text-destructive font-medium">{addErrors.phone}</p>
                )}
              </div>

              {/* 4. Password */}
              <div className="space-y-1.5">
                <Label htmlFor="add-password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="add-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter user password (min. 8 characters)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value); // NEVER trim password
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

              {/* 5. Role */}
              <div className="space-y-1.5">
                <Label htmlFor="add-role" className="text-xs font-semibold text-foreground">
                  Role
                </Label>
                <select
                  id="add-role"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as StaffRole);
                    setAddErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  disabled={addSubmitting}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-medium"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  * Owner role cannot be assigned.
                </p>
                {addErrors.role && (
                  <p className="text-[11px] text-destructive font-medium">{addErrors.role}</p>
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
                  {addSubmitting ? 'Adding user...' : 'Add user'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit User Modal (Name, Phone & Role) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Edit user
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update name, phone, and role for {editingUser.email}
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="edit-full-name" className="text-xs font-semibold text-foreground">
                  Full Name
                </Label>
                <Input
                  id="edit-full-name"
                  type="text"
                  value={editFullName}
                  onChange={(e) => {
                    setEditFullName(e.target.value);
                    setEditErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  disabled={editSubmitting}
                  required
                />
                {editErrors.fullName && (
                  <p className="text-[11px] text-destructive font-medium">{editErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-xs font-semibold text-foreground">
                  Phone <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="edit-phone"
                  type="text"
                  placeholder="E.g. +251 91 234 5678"
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    setEditErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  disabled={editSubmitting}
                />
                {editErrors.phone && (
                  <p className="text-[11px] text-destructive font-medium">{editErrors.phone}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-role-select" className="text-xs font-semibold text-foreground">
                  Select Role
                </Label>
                <select
                  id="edit-role-select"
                  value={editRole}
                  onChange={(e) => {
                    setEditRole(e.target.value as StaffRole);
                    setEditErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  disabled={editSubmitting}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-medium"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  * Owner role cannot be assigned.
                </p>
                {editErrors.role && (
                  <p className="text-[11px] text-destructive font-medium">{editErrors.role}</p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingUser(null)}
                  disabled={editSubmitting}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-full text-xs font-semibold"
                >
                  {editSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Confirmation Dialog: Activate / Deactivate */}
      {confirmStatusUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {confirmStatusUser.isActive ? 'Deactivate user' : 'Activate user'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Confirmation required
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              {confirmStatusUser.isActive ? (
                <>
                  Are you sure you want to deactivate{' '}
                  <span className="font-semibold text-primary">{confirmStatusUser.fullName}</span>?
                  Their active sessions will be invalidated and they will no longer be able to log in.
                </>
              ) : (
                <>
                  Are you sure you want to activate{' '}
                  <span className="font-semibold text-primary">{confirmStatusUser.fullName}</span>?
                  They will be permitted to log in to the portal.
                </>
              )}
            </p>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmStatusUser(null)}
                disabled={statusSubmitting}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteStatusToggle}
                disabled={statusSubmitting}
                variant={confirmStatusUser.isActive ? 'destructive' : 'default'}
                className="rounded-full text-xs font-semibold"
              >
                {statusSubmitting
                  ? 'Updating...'
                  : confirmStatusUser.isActive
                  ? 'Deactivate'
                  : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Confirmation Dialog: Password Reset */}
      {confirmResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Reset user password
                </h3>
                <p className="text-xs text-muted-foreground">
                  Security authorization
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              Generate a new temporary password for{' '}
              <span className="font-semibold text-primary">{confirmResetUser.fullName}</span>?
              Their existing password will be invalidated immediately and they must set a new password on login.
            </p>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmResetUser(null)}
                disabled={resetSubmitting}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteResetPassword}
                disabled={resetSubmitting}
                className="rounded-full text-xs font-semibold"
              >
                {resetSubmitting ? 'Resetting...' : 'Generate new password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Single-Use Temporary Password Modal (Shown Only Once) */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-primary/40 shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 text-primary">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {tempPasswordModal.actionType === 'created'
                    ? 'User Account Provisioned'
                    : 'Temporary Password Reset'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Credentials for {tempPasswordModal.userName} ({tempPasswordModal.userEmail})
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
                &bull; The user must change this password immediately upon their next login.
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
