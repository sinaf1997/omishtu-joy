import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Button } from '../../components/ui/button.js';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/staff';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setErrorMessage(axiosError.response?.data?.error?.message || 'Failed to authenticate');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected login error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="space-y-1 border-b border-border">
        <CardTitle className="text-2xl font-bold text-foreground">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access the Omishtu-Joy portal</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {errorMessage && (
            <div className="p-3.5 rounded-md bg-secondary border border-border text-foreground text-sm flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span className="font-medium text-xs">{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="staff@dev.local"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-primary">Development Test Accounts:</p>
            <p>Admin / Staff: <span className="font-mono text-foreground font-medium">admin@dev.local</span></p>
            <p>Password: <span className="font-mono text-foreground font-medium">DevPassword123!</span></p>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border pt-4">
          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
