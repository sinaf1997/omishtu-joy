import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ThemeToggle } from '../../components/ThemeToggle.js';
import {
  KeyRound,
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  // Staff update password exclusively inside My Profile (/staff/profile)
  useEffect(() => {
    if (user?.portal === 'staff') {
      navigate('/staff/profile', { replace: true });
    } else if (user?.portal === 'student') {
      navigate('/student/profile?reset=1', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must differ from current password');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      navigate('/student/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setErrorMessage(axiosError.response?.data?.error?.message || 'Failed to update password');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to update password. Please check your current password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background selection:bg-secondary selection:text-primary">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
          <ThemeToggle />
        </div>
        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="space-y-1.5 border-b border-border text-center pb-6">
            <div className="h-12 w-12 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center mb-1">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Update Your Password
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Choose a secure new password for your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-sm flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span className="font-medium text-xs">{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-foreground font-medium text-sm">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="pl-9 pr-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground font-medium text-sm">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    className="pl-9"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground font-medium text-sm">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    className="pl-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-5 pb-6 flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 font-semibold"
                disabled={loading}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{loading ? 'Updating Password...' : 'Save Password & Continue'}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
                disabled={loading}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cancel and Sign Out</span>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
