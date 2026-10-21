import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Badge } from '../../components/ui/badge.js';
import {
  User,
  IdCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Copy,
  Check,
  HeartHandshake,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const isResetForced = Boolean(user?.mustResetPassword || searchParams.get('reset') === '1');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Copy ID State
  const [copiedId, setCopiedId] = useState(false);

  const studentId = user?.studentCode || user?.student_code || 'OTC-STUDENT';
  const fullName = user?.fullName || user?.full_name || 'Student';
  const firstName = user?.firstName || user?.first_name || '';
  const lastName = user?.lastName || user?.last_name || '';
  const email = user?.email || null;
  const phone = user?.phone || null;
  const gender = user?.gender || null;
  const dob = user?.dateOfBirth || user?.date_of_birth || null;
  const address = user?.address || null;
  const city = user?.city || null;
  const registeredAt = user?.registeredAt || user?.registered_at || user?.createdAt || user?.created_at || null;
  const emergencyContacts = user?.emergencyContacts || user?.emergency_contacts || [];

  const handleCopyId = () => {
    if (studentId) {
      navigator.clipboard.writeText(studentId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must differ from current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordSuccess('Your password has been changed successfully. Your new password is now active.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Security Alert Banner for Forced Reset */}
      {isResetForced && !passwordSuccess && (
        <div className="p-4 rounded-xl bg-secondary border border-border flex items-start gap-3 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Password Reset Required
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Welcome to the Omishtu-Joy Student Portal! As a newly registered student, you must set your private password before continuing.
            </p>
          </div>
        </div>
      )}

      {/* 2. Student Profile Header Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xl border border-border shadow-inner">
                {firstName ? firstName[0].toUpperCase() : 'S'}
                {lastName ? lastName[0].toUpperCase() : ''}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="inline-flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-md border border-border text-xs font-mono font-medium text-foreground">
                    <IdCard className="h-3.5 w-3.5 text-primary" />
                    <span>{studentId}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      title="Copy Student ID"
                    >
                      {copiedId ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <Badge variant="outline" className="text-xs py-0.5 px-2 bg-card text-primary font-semibold">
                    Registered Student
                  </Badge>
                </div>
              </div>
            </div>
            {registeredAt && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Registered:{' '}
                  {new Date(registeredAt).toLocaleDateString(undefined, {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Personal & Contact Details + Emergency Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal & Contact Details */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Personal & Contact Details
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Your official identification on record at the training center
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">First Name</span>
                  <p className="text-sm font-semibold text-foreground">{firstName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Last Name</span>
                  <p className="text-sm font-semibold text-foreground">{lastName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Gender</span>
                  <p className="text-sm font-semibold text-foreground capitalize">{gender || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Date of Birth</span>
                  <p className="text-sm font-semibold text-foreground">{dob || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Phone Number</span>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{phone || '—'}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Email Address</span>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{email || 'Not provided'}</span>
                  </p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Address & City</span>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {[address, city].filter(Boolean).join(', ') || 'Not provided'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Emergency Contacts
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Designated emergency contact persons on file
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {emergencyContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No emergency contacts recorded.</p>
              ) : (
                <div className="space-y-3">
                  {emergencyContacts.map((contact, idx) => (
                    <div
                      key={contact.id || idx}
                      className="p-3.5 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {contact.fullName || contact.full_name}
                          </span>
                          {(contact.isPrimary ?? contact.is_primary) ? (
                            <Badge variant="outline" className="text-[10px] bg-secondary text-primary font-semibold">
                              Primary Contact
                            </Badge>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground block">
                          Relationship: <strong className="text-foreground">{contact.relationship}</strong>
                        </span>
                      </div>
                      <div className="text-xs space-y-0.5 sm:text-right">
                        <div className="font-mono text-foreground flex items-center sm:justify-end gap-1">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <span>{contact.phone}</span>
                        </div>
                        {(contact.alternatePhone || contact.alternate_phone) && (
                          <div className="text-muted-foreground font-mono">
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
        </div>

        {/* Right Column (1 col): Change Password Card */}
        <div className="space-y-6">
          <Card
            className={`border-border bg-card shadow-sm transition-all duration-200 ${
              isResetForced ? 'border-primary ring-2 ring-ring' : ''
            }`}
          >
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Change Password
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Update your student portal login password
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4 pt-5">
                {passwordError && (
                  <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="current-pass" className="text-xs font-medium text-foreground">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-pass"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-9 text-sm"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-medium text-foreground">
                    New Password (min 8 chars)
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-9 text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs font-medium text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pass"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-9 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 pb-5">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full rounded-full font-semibold text-xs py-2"
                >
                  {savingPassword ? 'Updating Password...' : 'Save New Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
