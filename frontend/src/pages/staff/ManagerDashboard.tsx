import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import {
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,

} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Operations Oversight
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Operations Manager
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>. Overall center scheduling, operational approval, and departmental metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Center Scheduling Sign-Off</CardTitle>
            <CardDescription>Timetable &amp; Cohort Approval</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Review proposed course schedules, resolve instructor timetable conflicts, and approve classroom usage.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Manager Supervision Tier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Intake &amp; Performance Metrics</CardTitle>
            <CardDescription>Center KPIs &amp; Attendance Analytics</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Monitor center-wide daily attendance trends, enrollment targets, completion rates, and instructor loads.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Full Analytics Scheduled for S9</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Operational Policy &amp; Audit</CardTitle>
            <CardDescription>Compliance &amp; Governance</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Ensure center compliance with academic policies, attendance thresholds, and student record management.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Audit Logs Scheduled for S8</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
