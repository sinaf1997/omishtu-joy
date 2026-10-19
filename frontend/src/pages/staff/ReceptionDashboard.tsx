import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import {
  Users,
  IdCard,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ReceptionDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Reception &amp; Front Desk
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Receptionist Portal
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>. Student in-person intake and identity provisioning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <IdCard className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">In-Person Intake</CardTitle>
            <CardDescription>Sprint 2 Module Foundation</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Front desk intake logs new student registrations, generates permanent Student IDs, and issues initial access credentials.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Authentication &amp; RBAC Active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Student Directory</CardTitle>
            <CardDescription>Quick verification and inquiries</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Lookup existing students, confirm enrollment status, and assist with credential resets.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Intake Pipeline Scheduled for S2</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Counter Cashiering</CardTitle>
            <CardDescription>Sprint 5 Cash Desk Integration</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Accept tuition deposits, cash and POS payments, and print immediate signed paper receipts.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Cashiering Modules Scheduled for S5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
