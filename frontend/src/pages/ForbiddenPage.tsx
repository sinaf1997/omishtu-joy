import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getStaffDashboardPath } from '../context/AuthContext.js';
import { StaffRole } from '../types/auth.js';
import { Button } from '../components/ui/button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();

  const getReturnPath = () => {
    if (!user) return '/';
    if (user.portal === 'student') return '/student/dashboard';
    return getStaffDashboardPath(user.role as StaffRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center shadow-lg border-border">
        <CardHeader className="space-y-2">
          <div className="h-16 w-16 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Access Restricted (403)
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Your current role or portal permissions do not grant access to this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="p-3.5 rounded-lg bg-secondary/80 border border-border text-xs text-secondary-foreground space-y-1">
            <p>
              Signed in as: <span className="font-semibold">{user?.fullName || user?.email || user?.studentCode}</span>
            </p>
            <p>
              Portal: <span className="font-semibold uppercase">{user?.portal}</span> &bull; Role: <span className="font-semibold uppercase">{user?.role}</span>
            </p>
          </div>
          <Link to={getReturnPath()}>
            <Button className="w-full rounded-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Your Dashboard</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
