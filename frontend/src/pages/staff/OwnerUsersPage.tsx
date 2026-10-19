import React, { useState, useEffect } from 'react';
import {
  listStaffApi,
  createStaffApi,
  updateStaffRoleApi,
  updateStaffStatusApi,
} from '../../api/users.js';
import { StaffMemberRecord, StaffRole } from '../../types/auth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Badge } from '../../components/ui/badge.js';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Power,
  PowerOff,
  UserCog,
} from 'lucide-react';

const ALL_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'owner', label: 'Center Owner' },
  { value: 'manager', label: 'Operations Manager' },
  { value: 'academic_admin', label: 'Academic Administrator' },
  { value: 'trainer', label: 'Course Trainer' },
  { value: 'accountant', label: 'Finance & Accountant' },
  { value: 'receptionist', label: 'Front Desk Receptionist' },
];

export const OwnerUsersPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Staff Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('trainer');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Temporary password modal state
  const [tempPasswordResult, setTempPasswordResult] = useState<{
    staff: StaffMemberRecord;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Active status toggling state per staff ID
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStaffApi();
      setStaffList(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!fullName.trim() || !email.trim()) {
      setCreateError('Please provide both full name and email address');
      return;
    }

    setCreateSubmitting(true);
    try {
      const result = await createStaffApi({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
      });

      setTempPasswordResult({
        staff: result.staff,
        tempPassword: result.temporaryPassword,
      });

      setFullName('');
      setEmail('');
      setSelectedRole('trainer');
      fetchStaff();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setCreateError(axiosError.response?.data?.error?.message || 'Failed to create staff account');
      } else if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('Failed to create staff account');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffMemberRecord) => {
    setUpdatingId(staff.id);
    try {
      const updated = await updateStaffStatusApi(staff.id, !staff.isActive);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? updated : s))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update account status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (staffId: string, newRole: StaffRole) => {
    setUpdatingId(staffId);
    try {
      const updated = await updateStaffRoleApi(staffId, newRole);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? updated : s))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyPassword = () => {
    if (tempPasswordResult) {
      navigator.clipboard.writeText(tempPasswordResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Staff Management Console
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Owner Only
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Create operational staff accounts, assign roles, and manage access privileges.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStaff}
          disabled={loading}
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </Button>
      </div>

      {/* Temporary Password One-Time Display Banner */}
      {tempPasswordResult && (
        <Card className="border-primary/50 bg-secondary/90 shadow-md">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <CheckCircle2 className="h-5 w-5" />
                <span>Staff Account Provisioned Successfully!</span>
              </div>
              <button
                onClick={() => setTempPasswordResult(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
            <CardDescription className="text-foreground text-xs mt-1">
              Account created for <span className="font-semibold text-primary">{tempPasswordResult.staff.fullName}</span> ({tempPasswordResult.staff.email}) with role <span className="font-semibold">{tempPasswordResult.staff.roleDisplayName}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="p-3.5 rounded-lg bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Temporary Password (Shown Once Only):</span>
                <span className="text-base font-mono font-bold text-foreground tracking-wider select-all">
                  {tempPasswordResult.tempPassword}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleCopyPassword}
                className="flex items-center gap-1.5 rounded-full"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Password'}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              &bull; This temporary password will <strong>not</strong> be displayed again. The staff member must change this password immediately upon their first login.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create New Staff Account Form */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Create New Staff Member</CardTitle>
              <CardDescription>
                Generates a secure temporary password and forces password reset on first login
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleCreateStaff}>
          <CardContent className="pt-6 space-y-4">
            {createError && (
              <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-name" className="text-xs font-semibold text-foreground">
                  Full Name
                </Label>
                <Input
                  id="staff-name"
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={createSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff-new-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <Input
                  id="staff-new-email"
                  type="email"
                  placeholder="name@omishtu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff-role" className="text-xs font-semibold text-foreground">
                  Assigned Staff Role
                </Label>
                <select
                  id="staff-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                  disabled={createSubmitting}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-medium"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>

          <div className="px-6 py-4 border-t border-border bg-secondary/20 flex justify-end">
            <Button
              type="submit"
              disabled={createSubmitting}
              className="rounded-full flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>{createSubmitting ? 'Provisioning...' : 'Provision Staff Account'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff Directory Table */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Staff Directory</CardTitle>
              <CardDescription>
                All registered staff members across all 6 center roles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading staff directory...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-muted-foreground space-y-2">
              <AlertCircle className="h-6 w-6 text-primary mx-auto" />
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={fetchStaff}>
                Retry
              </Button>
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No staff accounts found. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase font-semibold text-secondary-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Security Reset</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{staff.fullName}</div>
                        <div className="text-xs text-muted-foreground">{staff.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={staff.role}
                            onChange={(e) => handleRoleChange(staff.id, e.target.value as StaffRole)}
                            disabled={updatingId === staff.id}
                            className="text-xs rounded-md border border-input bg-card px-2 py-1 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {staff.isActive ? (
                          <Badge variant="outline" className="text-xs bg-card text-primary border-primary/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Deactivated
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {staff.mustResetPassword ? (
                          <Badge variant="secondary" className="text-[11px] font-medium text-secondary-foreground">
                            Reset Required
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(staff)}
                          disabled={updatingId === staff.id}
                          className={`text-xs gap-1.5 ${
                            staff.isActive
                              ? 'text-destructive hover:bg-secondary'
                              : 'text-primary hover:bg-secondary'
                          }`}
                        >
                          {staff.isActive ? (
                            <>
                              <PowerOff className="h-3.5 w-3.5" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <Power className="h-3.5 w-3.5" />
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
