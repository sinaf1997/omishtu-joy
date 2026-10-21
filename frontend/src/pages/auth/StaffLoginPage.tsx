import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getStaffDashboardPath } from '../../context/AuthContext.js';
import { StaffRole } from '../../types/auth.js';
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
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

export const StaffLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loginStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both staff email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await loginStaff({ email: cleanEmail, password });

      // Route directly to intended staff path or role dashboard
      const intendedPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (intendedPath && intendedPath.startsWith('/staff')) {
        navigate(intendedPath, { replace: true });
      } else {
        const destination = getStaffDashboardPath(user.role as StaffRole);
        navigate(destination, { replace: true });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setErrorMessage(axiosError.response?.data?.error?.message || 'Invalid email or password');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background selection:bg-secondary selection:text-primary">
      <div className="w-full max-w-md space-y-6">
        {/* Top bar with Back Link and Theme Toggle */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="space-y-1.5 border-b border-border text-center pb-6">
            <div className="h-12 w-12 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center mb-1">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Staff Portal Login
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in with your operational staff credentials
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
                <Label htmlFor="staff-email" className="text-foreground font-medium text-sm">
                  Staff Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="name@omishtu.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password" className="text-foreground font-medium text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-5 pb-6">
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 font-semibold"
                disabled={loading}
              >
                <span>{loading ? 'Verifying Credentials...' : 'Sign In to Staff Portal'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Staff Help Text */}
        <p className="text-center text-xs text-muted-foreground">
          Assigned roles: Owner, Manager, Academic Admin, Course Trainer, Accountant, Receptionist.
        </p>
      </div>
    </div>
  );
};
