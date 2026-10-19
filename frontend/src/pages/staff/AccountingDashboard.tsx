import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';
import {
  Receipt,
  CreditCard,
  BookMarked,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const AccountingDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Finance &amp; Accounting
            </h1>
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              Accountant Portal
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-primary">{user?.fullName || user?.email}</span>. Tuition invoicing, cashiering records, and financial accounting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <Receipt className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Tuition Invoicing &amp; Cashiering</CardTitle>
            <CardDescription>Sprint 5 Revenue Pipeline</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Fee structures, installment plan management, POS/cash desk cashiering, and automated PDF receipt generation.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>RBAC Permission: fees:invoicing &amp; payments:cashier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Accounts Payable &amp; Vendors</CardTitle>
            <CardDescription>Sprint 6 Supplier Bills &amp; Trainer Payouts</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Facility overhead tracking, utility bills, trainer remuneration disbursements, and payment vouchers.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Payables Pipeline Scheduled for S6</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center mb-2">
              <BookMarked className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">General Ledger &amp; Bank Rec</CardTitle>
            <CardDescription>Sprint 7 Double-Entry Core</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Standard chart of accounts, balanced journal entries, bank statement imports, and reconciliation.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>General Ledger Scheduled for S7</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
