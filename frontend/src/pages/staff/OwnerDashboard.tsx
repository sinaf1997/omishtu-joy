import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  Receipt,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Executive Dashboard
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Owner Authority
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>. Full operational governance and financial authority.
          </p>
        </div>

        <Link to="/staff/owner/users">
          <Button className="rounded-full shadow-sm gap-2">
            <Users className="h-4 w-4" />
            <span>Manage Staff Accounts</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Staff Members</p>
                <p className="text-2xl font-bold text-foreground mt-1">6 Roles</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className="text-primary font-semibold">Active:</span> Provisioning online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Academics</p>
                <p className="text-2xl font-bold text-foreground mt-1">Cohort Hub</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className="text-primary font-semibold">Schedules:</span> Ready for Sprint 3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Tuition Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">Cashiering</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className="text-primary font-semibold">Ledger:</span> Ready for Sprint 5-7
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Security &amp; RBAC</p>
                <p className="text-2xl font-bold text-foreground mt-1">Sprint 1</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <span className="text-primary font-semibold">Verified:</span> JWT &amp; Dual Portals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Staff Provisioning &amp; Role Management</CardTitle>
            </div>
            <CardDescription>
              Owner-only control panel for creating staff, assigning one of 6 roles, and toggling account status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              New staff members are provisioned with an auto-generated temporary password and forced password change on first sign-in.
            </p>
            <Link to="/staff/owner/users">
              <Button variant="outline" className="w-full flex items-center justify-between group">
                <span>Open Staff Management Console</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Training Center Operational Hub</CardTitle>
            </div>
            <CardDescription>
              Quick jump to departmental operations workspaces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/staff/manager" className="p-2.5 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors font-medium text-foreground block">
                &bull; Operations Manager
              </Link>
              <Link to="/staff/academics" className="p-2.5 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors font-medium text-foreground block">
                &bull; Academic Admin
              </Link>
              <Link to="/staff/accounting" className="p-2.5 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors font-medium text-foreground block">
                &bull; Finance &amp; Accounting
              </Link>
              <Link to="/staff/reception" className="p-2.5 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors font-medium text-foreground block">
                &bull; Front Desk Reception
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
