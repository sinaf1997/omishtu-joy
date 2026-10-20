import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';
import {
  User as UserIcon,
  Lock,
  Mail,
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  Check,
} from 'lucide-react';

function getInitials(name?: string, email?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'OJ';
}

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Never';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Never';
  }
}

function formatMemberSince(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

export const MyProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Information Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Synchronize state if user loaded or updated
  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Derived state for initials
  const initials = getInitials(fullName || user?.fullName, user?.email);
  const initialName = (user?.fullName || '').trim();
  const isNameChanged = fullName.trim() !== initialName && fullName.trim().length >= 2;

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setProfileError('Full name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 150) {
      setProfileError('Full name cannot exceed 150 characters');
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile(trimmed);
      setProfileSuccess('Profile information updated successfully');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setProfileError(axiosError.response?.data?.error?.message || 'Failed to update profile');
      } else if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError('Failed to update profile. Please try again.');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must differ from the current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Clear the form on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setPasswordError(axiosError.response?.data?.error?.message || 'Failed to update password');
      } else if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Failed to update password. Please check your current password.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const roleDisplay =
    user?.roleDisplayName ||
    user?.role_display_name ||
    (user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Staff Member');

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account details and password
        </p>
      </div>

      {/* Two Column Layout on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Profile Information */}
        <Card className="shadow-sm border-border bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Your personal identity and center access credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleProfileSubmit}>
              <CardContent className="pt-6 space-y-5">
                {/* Profile Success Toast */}
                {profileSuccess && (
                  <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{profileSuccess}</span>
                  </div>
                )}

                {/* Profile Error Alert */}
                {profileError && (
                  <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{profileError}</span>
                  </div>
                )}

                {/* Live Avatar Preview */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shrink-0 shadow-sm transition-transform">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {fullName || user?.fullName || 'Staff User'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {user?.email}
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {roleDisplay}
                    </span>
                  </div>
                </div>

                {/* Editable: Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="full-name" className="text-xs font-semibold text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={profileSaving}
                    required
                  />
                </div>

                {/* Read-only: Email */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                      Email Address
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Read-only</span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-9 bg-secondary/40 text-muted-foreground cursor-not-allowed border-border"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    Contact the owner to change this
                  </p>
                </div>

                {/* Read-only: Role */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="role" className="text-xs font-semibold text-foreground">
                      Assigned Role
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Read-only</span>
                  </div>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      type="text"
                      value={roleDisplay}
                      disabled
                      className="pl-9 bg-secondary/40 text-muted-foreground cursor-not-allowed border-border capitalize"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    Contact the owner to change this
                  </p>
                </div>

                {/* Read-only Account Info Metadata */}
                <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[11px] text-muted-foreground font-medium">Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-foreground">
                        {user?.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Last Login</span>
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-1 truncate">
                      {formatDate(user?.lastLoginAt || user?.last_login_at)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Member Since</span>
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-1 truncate">
                      {formatMemberSince(user?.createdAt || user?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={profileSaving || !isNameChanged}
                    className="w-full sm:w-auto flex items-center gap-2 rounded-full font-semibold text-xs px-5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{profileSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </div>
        </Card>

        {/* CARD 2: Change Password */}
        <Card className="shadow-sm border-border bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Update your account password to maintain system security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="pt-6 space-y-5">
                {/* Password Success Toast */}
                {passwordSuccess && (
                  <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{passwordSuccess}</span>
                  </div>
                )}

                {/* Password Error Alert */}
                {passwordError && (
                  <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{passwordError}</span>
                  </div>
                )}

                {/* Current Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="current-pw" className="text-xs font-semibold text-foreground">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current-pw"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      className="pl-9 pr-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={passwordSaving}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw" className="text-xs font-semibold text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-pw"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      className="pl-9 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordSaving}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Rules Under Field */}
                  <div className="pt-1 space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-muted-foreground'
                        }`}
                      />
                      <span className={newPassword.length >= 8 ? 'text-foreground font-medium' : ''}>
                        Minimum 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          newPassword && currentPassword && newPassword !== currentPassword
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground'
                        }`}
                      />
                      <span
                        className={
                          newPassword && currentPassword && newPassword !== currentPassword
                            ? 'text-foreground font-medium'
                            : ''
                        }
                      >
                        Must differ from current password
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw" className="text-xs font-semibold text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-pw"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      className="pl-9 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordSaving}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-destructive">Passwords do not match</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      !currentPassword ||
                      newPassword.length < 8 ||
                      newPassword === currentPassword ||
                      newPassword !== confirmPassword
                    }
                    className="w-full sm:w-auto flex items-center gap-2 rounded-full font-semibold text-xs px-5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};
