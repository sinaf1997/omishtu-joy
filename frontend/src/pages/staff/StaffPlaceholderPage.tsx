import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import { ShieldCheck, Users, Briefcase } from 'lucide-react';

export const StaffPlaceholderPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management Hub</h1>
          <p className="text-muted-foreground mt-1">
            Restricted operations workspace for Omishtu-Joy staff, trainers, and administrators
          </p>
        </div>
        <Badge variant="secondary" className="px-3.5 py-1 flex items-center gap-1.5 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="capitalize">Role: {user?.role}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Staff Operations Workspace</CardTitle>
            <CardDescription>Ready for business modules (S1–S9)</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This workspace is protected by both client-side route guards and backend role-authorization middleware (`authorize(['admin', 'staff', 'owner', 'manager'])`).
            </p>
            <div className="p-3.5 rounded-lg bg-secondary/80 border border-border text-xs text-secondary-foreground space-y-1">
              <span className="font-semibold block text-primary">Active RBAC Security:</span>
              <span>All staff endpoints require verified JWT bearer tokens with authorized role permissions.</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-2">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Session Identity</CardTitle>
            <CardDescription>Current authenticated identity record</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs text-foreground font-medium">{user?.id}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground">Account Email</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Permission Tier</span>
              <Badge variant="subtle" className="capitalize text-xs font-semibold">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
