import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import { Shield, Layers, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle.js';

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-primary tracking-tight">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <span>Omishtu-Joy</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isActive('/')
                    ? 'bg-secondary text-primary font-semibold'
                    : 'text-muted-foreground hover:text-primary hover:bg-secondary/50'
                }`}
              >
                Overview
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/portal"
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      isActive('/portal')
                        ? 'bg-secondary text-primary font-semibold'
                        : 'text-muted-foreground hover:text-primary hover:bg-secondary/50'
                    }`}
                  >
                    Student Portal
                  </Link>
                  {(user?.role === 'owner' || user?.role === 'manager') && (
                    <Link
                      to="/staff"
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        isActive('/staff')
                          ? 'bg-secondary text-primary font-semibold'
                          : 'text-muted-foreground hover:text-primary hover:bg-secondary/50'
                      }`}
                    >
                      Staff Hub
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm bg-secondary px-3 py-1 rounded-full border border-border">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs hidden sm:inline text-foreground">{user.email}</span>
                  <Badge variant="outline" className="text-xs uppercase tracking-wider py-0 px-2 bg-card text-primary font-semibold">
                    {user.role}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-1.5">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card text-muted-foreground text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Omishtu-Joy Training Center Management &bull; React 19 + Express + MySQL 8</span>
          </div>
          <div className="text-muted-foreground">Unified Purple &amp; White Theme</div>
        </div>
      </footer>
    </div>
  );
};
