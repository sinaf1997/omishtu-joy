import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '../ui/button.js';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-xl border border-dashed border-border bg-card text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="h-12 w-12 rounded-full bg-secondary text-primary flex items-center justify-center mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
