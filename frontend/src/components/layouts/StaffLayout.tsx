import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { StaffRole } from '../../types/auth.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import {
  Layers,
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Receipt,
  UserCheck,
  LogOut,
  Menu,
  X,
  Shield,
  KeyRound,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
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

  // Build navigation items based on current staff role
  const getNavItems = (): SidebarItem[] => {
    const items: SidebarItem[] = [];

    switch (role) {
      case 'owner':
        items.push(
          { label: 'Executive Dashboard', path: '/staff/owner', icon: LayoutDashboard },
          { label: 'Staff Management', path: '/staff/owner/users', icon: Users },
          { label: 'Operations Oversight', path: '/staff/manager', icon: CalendarCheck },
          { label: 'Academics & Cohorts', path: '/staff/academics', icon: GraduationCap },
          { label: 'Trainer Portal', path: '/staff/trainer', icon: UserCheck },
          { label: 'Accounting & Fees', path: '/staff/accounting', icon: Receipt },
          { label: 'Front Desk Reception', path: '/staff/reception', icon: Users }
        );
        break;
      case 'manager':
        items.push(
          { label: 'Operations Dashboard', path: '/staff/manager', icon: LayoutDashboard },
          { label: 'Academics & Cohorts', path: '/staff/academics', icon: GraduationCap },
          { label: 'Finance Overview', path: '/staff/accounting', icon: Receipt },
          { label: 'Front Desk Intake', path: '/staff/reception', icon: Users }
        );
        break;
      case 'academic_admin':
        items.push(
          { label: 'Academics Workspace', path: '/staff/academics', icon: LayoutDashboard },
          { label: 'Trainer Classes', path: '/staff/trainer', icon: UserCheck }
        );
        break;
      case 'trainer':
        items.push(
          { label: 'Trainer Workspace', path: '/staff/trainer', icon: LayoutDashboard }
        );
        break;
      case 'accountant':
        items.push(
          { label: 'Financial Desk', path: '/staff/accounting', icon: LayoutDashboard }
        );
        break;
      case 'receptionist':
        items.push(
          { label: 'Reception & Intake', path: '/staff/reception', icon: LayoutDashboard }
        );
        break;
      default:
        items.push({ label: 'Dashboard', path: '/staff/owner', icon: LayoutDashboard });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-foreground tracking-tight leading-tight">
                Omishtu-Joy
              </span>
              <span className="text-[10px] uppercase font-semibold text-primary tracking-wider">
                Staff Hub
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Role Banner */}
        <div className="px-6 py-4 bg-secondary/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
              {role.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
            {user?.fullName || user?.email}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/change-password"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            <span>Change Password</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
              aria-label="Open navigation sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
                Staff Portal
              </Badge>
              <span className="text-xs text-muted-foreground">&bull;</span>
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {role.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {user?.fullName || 'Staff Member'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full text-xs font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </Button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
