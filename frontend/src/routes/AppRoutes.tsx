import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout.js';
import { AuthLayout } from '../components/layouts/AuthLayout.js';
import { ProtectedRoute } from './ProtectedRoute.js';

import { LandingPage } from '../pages/LandingPage.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { PortalPlaceholderPage } from '../pages/portal/PortalPlaceholderPage.js';
import { StaffPlaceholderPage } from '../pages/staff/StaffPlaceholderPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages with Standard Header/Footer */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />

        {/* Protected User Portal */}
        <Route element={<ProtectedRoute />}>
          <Route path="/portal" element={<PortalPlaceholderPage />} />
        </Route>

        {/* Protected Staff & Admin Hub */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
          <Route path="/staff" element={<StaffPlaceholderPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Authentication Pages with Minimal Centered Layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
};
