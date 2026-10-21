import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import {

  Calendar,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const AcademicsDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Academic Administration
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Academic Admin
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>. Curriculum catalogs, cohort timetables, and graduation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Course Catalog &amp; Cohorts</CardTitle>
            <CardDescription>Sprint 3 Core Academics</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Short-course syllabus definitions, cohort batches, classroom allocations, and trainer assignments.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>RBAC Permission: courses:manage</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Timetable &amp; Schedules</CardTitle>
            <CardDescription>Session coordination</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Weekly timetables, instructor hours, classroom occupancy, and holiday scheduling.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Timetable Planner Scheduled for S3</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <Award className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Certification &amp; Graduation</CardTitle>
            <CardDescription>Sprint 4 QR Verification</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Automated completion criteria checks, QR code verifiable certificate generation, and batch PDF export.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Certificates Pipeline Scheduled for S4</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
