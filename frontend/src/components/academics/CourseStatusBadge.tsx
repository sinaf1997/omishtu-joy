import React from 'react';
import { CourseStatus } from '../../types/courses.js';

interface CourseStatusBadgeProps {
  status: CourseStatus;
  className?: string;
}

export const CourseStatusBadge: React.FC<CourseStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'draft':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border ${className}`}
        >
          Draft
        </span>
      );
    case 'open':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 ${className}`}
        >
          Open
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground border border-border ${className}`}
        >
          In Progress
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
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 ${className}`}
        >
          Cancelled
        </span>
      );
    default:
      return null;
  }
};
