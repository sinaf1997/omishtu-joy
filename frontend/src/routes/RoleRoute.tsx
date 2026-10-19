import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { StaffRole } from '../types/auth.js';

interface RoleRouteProps {
  allowedRoles: StaffRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/staff/login" replace />;
  }

  if (user.portal !== 'staff') {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (!allowedRoles.includes(user.role as StaffRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
