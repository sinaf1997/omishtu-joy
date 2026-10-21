import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getStaffDashboardPath } from '../context/AuthContext.js';
import { StaffRole } from '../types/auth.js';
import {
  GraduationCap,
  Calendar,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle.js';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // If user is already logged in, determine their destination
  const getDestinationPath = () => {
    if (!isAuthenticated || !user) return null;
    if (user.portal === 'student') return '/student/dashboard';
    return getStaffDashboardPath(user.role as StaffRole);
  };

  const authenticatedDestination = getDestinationPath();

  const featureCards = [
    {
      icon: GraduationCap,
      title: 'Students',
      description:
        'In-person intake, receptionist-issued student IDs, emergency contacts, and complete academic profiles.',
    },
    {
      icon: Calendar,
      title: 'Schedule',
      description:
        'Course cohorts, classroom assignments, timetable scheduling, and session-by-session attendance tracking.',
    },
    {
      icon: Receipt,
      title: 'Finance',
      description:
        'Tuition fee schedules, cashiering at front desk, automated PDF receipts, and general ledger reconciliation.',
    },
    {
      icon: ShieldCheck,
      title: 'Security',
      description:
        'Isolated staff and student portals, role-based authorization, enforced password resets, and session guards.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-secondary selection:text-primary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-foreground leading-none">
                Omishtu-Joy
              </span>
              <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground mt-1">
                Training Center OS
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {isAuthenticated && authenticatedDestination ? (
              <Link
                to={authenticatedDestination}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 shadow-sm transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/student/login"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1"
                >
                  Student Login
                </Link>
                <Link
                  to="/staff/login"
                  className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 shadow-sm transition-all"
                >
                  Staff Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero & Content Surface */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Subtle decorative purple glow using existing background and secondary tokens */}
        <div className="w-full relative overflow-hidden py-16 sm:py-24">
          {/* Subtle grid and decorative glow using semantic tokens */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 dark:opacity-20 pointer-events-none" />
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[32rem] sm:w-[48rem] h-[20rem] bg-primary/10 dark:bg-primary/20 blur-3xl rounded-full -z-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center relative z-10">
            {/* Small Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/70 shadow-sm mb-6">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold tracking-wide text-secondary-foreground">
                Built for modern training centers
              </span>
            </div>

            {/* Big Headline with machine in primary purple */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
              Run your training center like a{' '}
              <span className="text-primary relative inline-block">
                machine.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              One unified platform for center owners, managers, reception, academic staff,
              trainers, and students. Intake, attendance, grading, tuition cashiering, and
              financial governance — all organized in a high-efficiency system.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <Link
                to="/staff/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-base font-semibold shadow-md hover:bg-primary/90 transition-all group"
              >
                <span>Staff sign in</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/student/login"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-border bg-card text-foreground px-8 py-3.5 text-base font-semibold shadow-sm hover:bg-secondary hover:text-primary transition-all"
              >
                Student sign in
              </Link>
            </div>

            {/* Fast Stats or Guarantee indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Zero ORM Pure SQL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Isolated Dual Portals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>6 Granular Staff Roles</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col group"
                >
                  <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Omishtu-Joy Training Center Management System</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/staff/login" className="hover:text-primary transition-colors">
              Staff Portal
            </Link>
            <Link to="/student/login" className="hover:text-primary transition-colors">
              Student Portal
            </Link>
            <span>&copy; {new Date().getFullYear()} Omishtu-Joy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
