import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isStaffRoute = location.pathname.startsWith('/staff');
    const redirectPath = isStaffRoute ? '/staff/login' : '/student/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Force password reset if flagged
  if (user?.mustResetPassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
};
