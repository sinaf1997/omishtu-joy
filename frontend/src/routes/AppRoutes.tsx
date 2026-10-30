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
import { ReceptionDashboard } from '../pages/staff/ReceptionDashboard.js';
import { AcademicsDashboard } from '../pages/staff/AcademicsDashboard.js';
import { TrainerDashboard } from '../pages/staff/TrainerDashboard.js';
import { AccountingDashboard } from '../pages/staff/AccountingDashboard.js';
import { ManagerDashboard } from '../pages/staff/ManagerDashboard.js';

// Sprint 2: Student Management Pages (Staff/Receptionist Side)
import { StudentListPage } from '../pages/staff/StudentListPage.js';
import { StudentRegistrationPage } from '../pages/staff/StudentRegistrationPage.js';
import { StudentDetailPage } from '../pages/staff/StudentDetailPage.js';
import { StudentSlipPage } from '../pages/staff/StudentSlipPage.js';

// Sprint 3: Academics & Courses Pages
import { CoursesListPage } from '../pages/staff/academics/CoursesListPage.js';
import { CourseFormPage } from '../pages/staff/academics/CourseFormPage.js';
import { CourseDetailPage } from '../pages/staff/academics/CourseDetailPage.js';
import { EnrollmentsListPage } from '../pages/staff/academics/EnrollmentsListPage.js';

// Student Portal Pages
import { StudentDashboard } from '../pages/student/StudentDashboard.js';
import { StudentProfilePage } from '../pages/student/StudentProfilePage.js';
import { StudentMembershipPage } from '../pages/student/StudentMembershipPage.js';
import { BrowseTrainersPage } from '../pages/student/BrowseTrainersPage.js';
import { StudentMessagesPage } from '../pages/student/StudentMessagesPage.js';
import { StudentConsistencyPage } from '../pages/student/StudentConsistencyPage.js';
import { ClassPlanPage } from '../pages/student/ClassPlanPage.js';
import { StudentClassesPage } from '../pages/student/StudentClassesPage.js';
import { StudentProgressPage } from '../pages/student/StudentProgressPage.js';
import { BrowseCoursesPage } from '../pages/student/BrowseCoursesPage.js';

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
      {/* 1. Public Marketing Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Public-only Auth Pages (Redirects already authenticated users to their portal) */}
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

            {/* Sprint 2: Students Management (Owner, Manager, Academic Admin, Receptionist, Accountant) */}
            <Route
              element={
                <RoleRoute
                  allowedRoles={['owner', 'manager', 'receptionist', 'academic_admin', 'accountant']}
                />
              }
            >
              <Route path="reception/students" element={<StudentListPage />} />
              <Route path="reception/students/new" element={<StudentRegistrationPage />} />
              <Route path="reception/students/:id" element={<StudentDetailPage />} />
              <Route path="reception/students/:id/slip" element={<StudentSlipPage />} />
              <Route path="students" element={<Navigate to="/staff/reception/students" replace />} />
            </Route>

            {/* Sprint 3: Courses Management */}
            <Route
              element={
                <RoleRoute
                  allowedRoles={['owner', 'manager', 'academic_admin', 'receptionist', 'trainer']}
                />
              }
            >
              <Route path="academics/courses" element={<CoursesListPage />} />
              <Route path="academics/courses/:id" element={<CourseDetailPage />} />
              <Route path="courses" element={<Navigate to="/staff/academics/courses" replace />} />
            </Route>

            {/* Course Create & Edit Routes (Manage Permission: Owner, Manager, Academic Admin) */}
            <Route
              element={
                <RoleRoute allowedRoles={['owner', 'manager', 'academic_admin']} />
              }
            >
              <Route path="academics/courses/new" element={<CourseFormPage />} />
              <Route path="academics/courses/:id/edit" element={<CourseFormPage />} />
            </Route>

            {/* Sprint 3 (Part 2): Student Enrollments & Waitlists */}
            <Route
              element={
                <RoleRoute
                  allowedRoles={['owner', 'manager', 'academic_admin', 'receptionist']}
                />
              }
            >
              <Route path="enrollments" element={<EnrollmentsListPage />} />
            </Route>

            {/* Shared Coming Soon Routes for Planned Sprints */}
            <Route path="documents" element={<ComingSoonPage />} />
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
            <Route path="membership" element={<StudentMembershipPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="trainers" element={<BrowseTrainersPage />} />
            <Route path="messages" element={<StudentMessagesPage />} />
            <Route path="consistency" element={<StudentConsistencyPage />} />
            <Route path="class-plan" element={<ClassPlanPage />} />
            <Route path="courses" element={<BrowseCoursesPage />} />
            <Route path="classes" element={<StudentClassesPage />} />
            <Route path="progress" element={<StudentProgressPage />} />
          </Route>
        </Route>
      </Route>

      {/* 6. Utility Error Pages */}
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
