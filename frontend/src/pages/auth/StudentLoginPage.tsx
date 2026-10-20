import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import {
  Lock,
  IdCard,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
} from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = studentCode.trim();
    if (!cleanCode || !password) {
      setErrorMessage('Please provide both your Student ID and password');
      return;
    }

    setLoading(true);
    try {
      await loginStudent({ studentCode: cleanCode, password });

      // Check for redirected path from route guard or default to student dashboard
      const intendedPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (intendedPath && intendedPath.startsWith('/student')) {
        navigate(intendedPath, { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setErrorMessage(axiosError.response?.data?.error?.message || 'Invalid Student ID or password');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication failed. Please verify your Student ID and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background selection:bg-secondary selection:text-primary">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Login Card */}
        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="space-y-1.5 border-b border-border text-center pb-6">
            <div className="h-12 w-12 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center mb-1">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Student Portal Login
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your receptionist-issued Student ID to access your student hub
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
                <Label htmlFor="student-id" className="text-foreground font-medium text-sm">
                  Student ID Number
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="student-id"
                    type="text"
                    placeholder="e.g. STD-2026-001"
                    className="pl-9 font-mono"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-password" className="text-foreground font-medium text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="student-password"
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
                <span>{loading ? 'Verifying Account...' : 'Sign In to Student Portal'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Student notice */}
        <p className="text-center text-xs text-muted-foreground">
          Need your credentials? Contact the reception desk at the training center.
        </p>
      </div>
    </div>
  );
};
