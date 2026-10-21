import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import { ThemeToggle } from '../ThemeToggle.js';
import {
  Layers,
  GraduationCap,
  LogOut,
  KeyRound,
  IdCard,
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Student Top Navigation Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/student/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
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

          {/* Right Navigation & User Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-border">
              <IdCard className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-secondary-foreground font-mono">
                {user?.studentCode || 'Student ID'}
              </span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-1.5 bg-card text-primary font-semibold">
                Active Student
              </Badge>
            </div>

            <ThemeToggle />

            <Link to="/change-password">
              <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Security</span>
              </Button>
            </Link>

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
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Student Footer */}
      <footer className="border-t border-border bg-card text-muted-foreground text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>Omishtu-Joy Training Center Student Portal</span>
          <span>Inquiries &bull; Reception Front Desk</span>
        </div>
      </footer>
    </div>
  );
};
