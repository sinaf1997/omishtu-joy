import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import {
  IdCard,
  Calendar,
  CheckSquare,
  Award,
  Receipt,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Student Hub
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Self-Service Portal
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome back! Student ID: <span className="font-mono font-bold text-primary">{user?.studentCode}</span>
          </p>
        </div>

        <div className="bg-card px-4 py-2 rounded-xl border border-border shadow-sm flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground">Active Enrollment Status</span>
        </div>
      </div>

      {/* Student Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Student ID</p>
                <p className="text-lg font-bold font-mono text-foreground mt-1">{user?.studentCode}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <IdCard className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-primary font-medium mt-3 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified ID
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">My Classes</p>
                <p className="text-lg font-bold text-foreground mt-1">Short Course</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Schedule in S3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Attendance</p>
                <p className="text-lg font-bold text-foreground mt-1">Sessions</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <CheckSquare className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Marking in S4
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Receipts</p>
                <p className="text-lg font-bold text-foreground mt-1">Tuition POS</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Cashiering in S5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Portal Information Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Student Portal Security Verified</CardTitle>
                <CardDescription>Authenticated with reception-issued credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your student account is active with secure stateless JWT session tokens.
              You have access to self-service features tailored for enrolled learners.
            </p>
            <div className="p-3.5 rounded-lg bg-secondary/70 border border-border space-y-1 text-xs text-foreground">
              <span className="font-semibold text-primary block">Upcoming Student Portal Features:</span>
              <p>&bull; Sprint 3: View course cohort timetables, classroom locations, and instructor profiles.</p>
              <p>&bull; Sprint 4: Real-time attendance percentage breakdown and assessment test grades.</p>
              <p>&bull; Sprint 4: Download verifiable digital completion certificates with instant QR verification.</p>
              <p>&bull; Sprint 5: Digital tuition invoices, installment balance tracking, and PDF receipts.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary text-primary flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Credentials &amp; Security</CardTitle>
                <CardDescription>Manage your student portal account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Student ID Number</span>
              <span className="font-mono font-semibold text-foreground">{user?.studentCode}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Portal Surface</span>
              <Badge variant="outline" className="text-xs uppercase bg-card text-primary font-semibold">
                Student Portal Only
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Account Status</span>
              <Badge variant="secondary" className="text-xs font-semibold">
                Active Enrolled
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
