import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { LayoutDashboard, CheckCircle2 } from 'lucide-react';

export const PortalPlaceholderPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Portal</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-primary">{user?.email}</span>
          </p>
        </div>
        <Badge variant="secondary" className="px-3.5 py-1 text-xs font-semibold">
          Authenticated Session Active
        </Badge>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Student Self-Service Portal</CardTitle>
          <CardDescription>Academics, timetable, attendance history, and fee receipts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
          <p>
            Your session is verified with JSON Web Tokens (JWT) issued by the Omishtu-Joy API backend.
          </p>
          <div className="p-4 rounded-lg bg-secondary/80 border border-border space-y-2">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-primary font-semibold">Full-Stack Integration Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frontend state is synchronized with backend token verification. As business modules are implemented, your cohort schedule, assignment grades, QR certificate downloads, and tuition installment receipts will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
