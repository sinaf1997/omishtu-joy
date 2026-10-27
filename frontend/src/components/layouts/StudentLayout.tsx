import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { STUDENT_NAV_ITEMS } from '../../config/studentNavigation.js';
import { ThemeToggle } from '../ThemeToggle.js';
import {
  Layers,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'ST';
}

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const studentName = user?.fullName || user?.full_name || user?.firstName || 'Student';
  const studentCode = user?.studentCode || user?.student_code || 'otc/00001/26';
  const initials = getInitials(studentName, user?.email);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Left Sidebar (Fixed, Scrollable, Collapsible on Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Student Navigation Sidebar"
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0">
          <Link
            to="/student/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-foreground tracking-tight leading-tight">
                Omishtu-Joy
              </span>
              <span className="text-[10px] uppercase font-semibold text-primary tracking-wider flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Student Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Student Menu
          </div>
          {STUDENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/student/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.isReal && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold group-hover:bg-card">
                    Real
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Bottom: User Card with Real Initials, Name & Student ID, plus Logout */}
        <div className="p-3 border-t border-border shrink-0 bg-card">
          <div className="p-2.5 rounded-xl bg-secondary/60 border border-border flex items-center justify-between gap-3">
            <Link
              to="/student/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
              title="View Student Profile"
            >
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {studentName}
                </p>
                <p className="text-[11px] text-primary truncate font-mono font-medium">
                  {studentCode}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-card transition-colors shrink-0"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Shell (Offset for fixed sidebar on lg screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Open navigation sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Omishtu-Joy Training Center
              </span>
              <span className="text-muted-foreground">&bull;</span>
              <span className="text-xs font-medium text-foreground">Self-Service Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Student ID / Profile Link */}
            <Link
              to="/student/profile"
              className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-85 transition-opacity"
              title="View Profile"
            >
              <div className="h-8 w-8 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-foreground block leading-tight">
                  {studentName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono block leading-tight">
                  {studentCode}
                </span>
              </div>
            </Link>

            {/* Topbar Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
              aria-label="Log Out"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* 3. Page Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>

        {/* 4. Student Portal Footer */}
        <footer className="border-t border-border bg-card text-muted-foreground text-xs py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Omishtu-Joy Training Center &bull; Student Portal</span>
            <span className="font-mono text-[11px]">OTC Student Platform v2.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
