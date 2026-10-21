import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getStaffDashboardPath } from '../context/AuthContext.js';
import { StaffRole } from '../types/auth.js';

// Layouts
import { StaffLayout } from '../components/layouts/StaffLayout.js';
import { StudentLayout } from '../components/layouts/StudentLayout.js';

// Guards
import { ProtectedRoute } from './ProtectedRoute.js';
import { PublicOnlyRoute } from './PublicOnlyRoute.js';
import { PortalRoute } from './PortalRoute.js';
import { RoleRoute } from './RoleRoute.js';

// Pages
import { LandingPage } from '../pages/LandingPage.js';
import { StaffLoginPage } from '../pages/auth/StaffLoginPage.js';
import { StudentLoginPage } from '../pages/auth/StudentLoginPage.js';
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage.js';
import { ForbiddenPage } from '../pages/ForbiddenPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { ComingSoonPage } from '../pages/ComingSoonPage.js';

// Staff Dashboards & Profile
import { MyProfilePage } from '../pages/staff/MyProfilePage.js';
import { OwnerDashboard } from '../pages/staff/OwnerDashboard.js';
import { OwnerUsersPage } from '../pages/staff/OwnerUsersPage.js';
import { StudentsPage } from '../pages/staff/StudentsPage.js';
import { ReceptionDashboard } from '../pages/staff/ReceptionDashboard.js';
import { AcademicsDashboard } from '../pages/staff/AcademicsDashboard.js';
import { TrainerDashboard } from '../pages/staff/TrainerDashboard.js';
import { AccountingDashboard } from '../pages/staff/AccountingDashboard.js';
import { ManagerDashboard } from '../pages/staff/ManagerDashboard.js';

// Student Dashboard
import { StudentDashboard } from '../pages/student/StudentDashboard.js';

// Helper component to redirect root /staff to the current staff role's dashboard
const StaffRoleRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user || user.portal !== 'staff') {
    return <Navigate to="/staff/login" replace />;
  }
  const target = getStaffDashboardPath(user.role as StaffRole);
  return <Navigate to={target} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Public-Only Authentication Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route path="/student/login" element={<StudentLoginPage />} />
      </Route>

      {/* 3. Global Protected Routes (Both Staff and Student) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* 4. Staff Portal Routes (Strictly Isolated to Staff Token) */}
        <Route element={<PortalRoute portal="staff" />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffRoleRedirect />} />

            {/* My Profile Page - Accessible to all staff roles */}
            <Route path="profile" element={<MyProfilePage />} />

            {/* Owner Role Only */}
            <Route element={<RoleRoute allowedRoles={['owner']} />}>
              <Route path="owner" element={<OwnerDashboard />} />
            </Route>

            {/* Users & Roles Management: Accessible to Owner and Receptionist */}
            <Route element={<RoleRoute allowedRoles={['owner', 'receptionist']} />}>
              <Route path="owner/users" element={<OwnerUsersPage />} />
            </Route>

            {/* Manager Role (and Owner) */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager']} />}>
              <Route path="manager" element={<ManagerDashboard />} />
            </Route>

            {/* Academic Admin (and Owner, Manager) */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager', 'academic_admin']} />}>
              <Route path="academics" element={<AcademicsDashboard />} />
            </Route>

            {/* Trainer (and Owner, Manager, Academic Admin) */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager', 'academic_admin', 'trainer']} />}>
              <Route path="trainer" element={<TrainerDashboard />} />
            </Route>

            {/* Accountant (and Owner, Manager) */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager', 'accountant']} />}>
              <Route path="accounting" element={<AccountingDashboard />} />
            </Route>

            {/* Receptionist (and Owner, Manager, Academic Admin) */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager', 'academic_admin', 'receptionist']} />}>
              <Route path="reception" element={<ReceptionDashboard />} />
            </Route>

            {/* Students Management (Owner, Manager, Receptionist, Academic Admin) */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager', 'receptionist', 'academic_admin']} />}>
              <Route path="students" element={<StudentsPage />} />
            </Route>

            {/* Shared Coming Soon Routes for Planned Sprints */}
            <Route path="documents" element={<ComingSoonPage />} />
            <Route path="courses" element={<ComingSoonPage />} />
            <Route path="enrollments" element={<ComingSoonPage />} />
            <Route path="attendance" element={<ComingSoonPage />} />
            <Route path="grading" element={<ComingSoonPage />} />
            <Route path="certificates" element={<ComingSoonPage />} />
            <Route path="fees" element={<ComingSoonPage />} />
            <Route path="receivables" element={<ComingSoonPage />} />
            <Route path="payables" element={<ComingSoonPage />} />
            <Route path="ledger" element={<ComingSoonPage />} />
            <Route path="reconciliation" element={<ComingSoonPage />} />
            <Route path="tax-budgets" element={<ComingSoonPage />} />
            <Route path="audit-log" element={<ComingSoonPage />} />
            <Route path="analytics" element={<ComingSoonPage />} />
          </Route>
        </Route>

        {/* 5. Student Portal Routes (Strictly Isolated to Student Token) */}
        <Route element={<PortalRoute portal="student" />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* 6. Utility & Error Pages */}
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
