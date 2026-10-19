import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getStaffStatsApi, listStaffApi } from '../../api/users.js';
import { StaffStats, StaffMemberRecord } from '../../types/auth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [recentStaff, setRecentStaff] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, staffList] = await Promise.all([
        getStaffStatsApi(),
        listStaffApi(),
      ]);
      setStats(statsData);
      setRecentStaff(staffList.slice(0, 5)); // 5 most recent
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load owner dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Executive Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Center operations, personnel management, and system governance for <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-full gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Link to="/staff/owner/users">
            <Button size="sm" className="rounded-full gap-2 text-xs font-semibold shadow-sm">
              <UserPlus className="h-3.5 w-3.5" />
              <span>New Staff Member</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-secondary border border-border text-foreground text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* 4 Stat Cards with Real Counts from API */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <Card className="shadow-sm border-border bg-card hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Staff
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.totalStaff ?? 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Registered center staff members
            </p>
          </CardContent>
        </Card>

        {/* Active Staff */}
        <Card className="shadow-sm border-border bg-card hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Active Staff
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.activeStaff ?? 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Authorized to sign into Staff Hub
            </p>
          </CardContent>
        </Card>

        {/* Inactive Staff */}
        <Card className="shadow-sm border-border bg-card hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Inactive Staff
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.inactiveStaff ?? 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <UserX className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Deactivated or suspended accounts
            </p>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card className="shadow-sm border-border bg-card hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  System Roles
                </p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? '—' : stats?.totalRoles ?? 6}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Standard operational authority tiers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Staff Accounts Table */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="border-b border-border flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Recent Staff Accounts</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Latest provisioned center personnel
            </CardDescription>
          </div>
          <Link to="/staff/owner/users">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:text-foreground">
              <span>View all users</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading staff accounts...</span>
            </div>
          ) : recentStaff.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase font-semibold text-secondary-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-foreground">
                        {staff.fullName}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-muted-foreground font-mono">
                        {staff.email}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant="outline" className="text-xs capitalize font-medium bg-card text-foreground">
                          {staff.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6">
                        {staff.isActive ? (
                          <Badge variant="outline" className="text-xs bg-card text-primary border-primary/30 font-semibold">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs font-semibold">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right text-xs text-muted-foreground">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
