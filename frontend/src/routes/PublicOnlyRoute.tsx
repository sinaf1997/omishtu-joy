import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getStaffDashboardPath } from '../context/AuthContext.js';
import { StaffRole } from '../types/auth.js';

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">Checking session...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.mustResetPassword) {
      return <Navigate to="/change-password" replace />;
    }

    if (user.portal === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }

    const staffPath = getStaffDashboardPath(user.role as StaffRole);
    return <Navigate to={staffPath} replace />;
  }

  return <Outlet />;
};
