import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { StaffRole } from '../../types/auth.js';
import { getNavItemsForRole, NAV_SECTIONS, NavSection } from '../../config/navigation.js';
import { ThemeToggle } from '../ThemeToggle.js';
import {
  Layers,
  Search,
  Bell,
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
  return 'OJ';
}

export const StaffLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const role = (user?.role || 'owner') as StaffRole;
  const navBySection = getNavItemsForRole(role);
  const initials = getInitials(user?.fullName, user?.email);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 1. Sidebar (Fixed, Scrollable, Mobile Collapsible) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-foreground tracking-tight leading-tight">
                Omishtu-Joy
              </span>
              <span className="text-[10px] uppercase font-semibold text-primary tracking-wider">
                Training Center OS
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grouped Nav Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {NAV_SECTIONS.map((section: NavSection) => {
            const items = navBySection[section];
            if (!items || items.length === 0) return null;

            return (
              <div key={section} className="space-y-1">
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {section}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      end={item.section === 'OVERVIEW'}
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
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
                      {!item.isFunctional && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold group-hover:bg-card">
                          S{item.sprint}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-border shrink-0 bg-card">
          <div className="p-2 rounded-xl bg-secondary/60 border border-border flex items-center justify-between gap-3">
            <Link
              to="/staff/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
              title="My Profile"
            >
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.fullName || 'Staff User'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  {user?.email}
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
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search Input (Visual Only) */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students, invoices, courses…"
                className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell (Placeholder) */}
            <button
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>

            {/* User Profile Pill */}
            <Link
              to="/staff/profile"
              className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-85 transition-opacity"
              title="My Profile"
            >
              <div className="h-8 w-8 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-foreground block leading-tight">
                  {user?.fullName || 'Staff User'}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize block leading-tight font-medium">
                  {role.replace('_', ' ')}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* 3. Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Child Page Content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
