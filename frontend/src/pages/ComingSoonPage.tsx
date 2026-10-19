import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../config/navigation.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Clock, ArrowLeft, Construction } from 'lucide-react';

export const ComingSoonPage: React.FC = () => {
  const location = useLocation();

  // Match current path to navigation registry item
  const matchedItem = NAVIGATION_ITEMS.find((item) => item.path === location.pathname);

  const title = matchedItem ? matchedItem.label : 'Module';
  const sprint = matchedItem ? matchedItem.sprint : 2;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="text-center shadow-sm border-border bg-card">
        <CardHeader className="space-y-3 pb-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center border border-border shadow-sm">
            <Construction className="h-8 w-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 justify-center">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Sprint {sprint} Roadmap
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {title} Module
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
            This module is scheduled for implementation in <strong>Sprint {sprint}</strong>. Foundation and RBAC security are active in Sprint 1.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="p-4 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground flex items-center justify-center gap-2 max-w-md mx-auto">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span>Architecture, database schema, and role permissions are already registered for this module.</span>
          </div>
          <div>
            <Link to="/staff/owner">
              <Button variant="outline" className="rounded-full gap-2 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
