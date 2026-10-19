import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import {
  CheckSquare,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Trainer Workspace
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Instructor Desk
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>. Mark attendance, record assessment scores, and track student mastery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <CheckSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Classroom Attendance</CardTitle>
            <CardDescription>Sprint 4 Daily Attendance Marking</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Real-time session attendance logging: Present, Absent, Late, or Excused with automatic hour calculations.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>RBAC Permission: attendance:mark</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Student Assessments</CardTitle>
            <CardDescription>Practical tests &amp; grading</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Submit test results, practical project evaluations, and instructor feedback notes for your cohort.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Assessment Entry Scheduled for S4</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Teaching Schedule</CardTitle>
            <CardDescription>Assigned cohort sessions</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              View assigned classes, assigned classrooms, and upcoming session topics.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Instructor Schedule Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
