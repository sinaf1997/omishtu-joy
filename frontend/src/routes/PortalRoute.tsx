import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { PortalType, StaffRole } from '../types/auth.js';
import { getStaffDashboardPath } from '../context/AuthContext.js';

interface PortalRouteProps {
  portal: PortalType;
}

export const PortalRoute: React.FC<PortalRouteProps> = ({ portal }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={portal === 'staff' ? '/staff/login' : '/student/login'} replace />;
  }

  // Enforce portal isolation: student cannot access staff, staff cannot access student
  if (user.portal !== portal) {
    if (user.portal === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      const staffDashboard = getStaffDashboardPath(user.role as StaffRole);
      return <Navigate to={staffDashboard} replace />;
    }
  }

  return <Outlet />;
};
