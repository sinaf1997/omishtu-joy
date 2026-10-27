import React from 'react';
import { EnrollmentStatus } from '../../types/enrollments.js';

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  className?: string;
}

export const EnrollmentStatusBadge: React.FC<EnrollmentStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'active':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 ${className}`}
        >
          Active
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-secondary ${className}`}
        >
          Completed
        </span>
      );
    case 'dropped':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/15 text-warning border border-warning/30 ${className}`}
        >
          Dropped
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 ${className}`}
        >
          Cancelled
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border ${className}`}
        >
          {status}
        </span>
      );
  }
};
