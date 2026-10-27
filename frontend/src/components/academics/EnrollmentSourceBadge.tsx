import React from 'react';
import { EnrollmentSource } from '../../types/enrollments.js';

interface EnrollmentSourceBadgeProps {
  source: EnrollmentSource;
  className?: string;
}

export const EnrollmentSourceBadge: React.FC<EnrollmentSourceBadgeProps> = ({ source, className = '' }) => {
  if (source === 'waitlist') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground border border-border ${className}`}
      >
        From Waitlist
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border ${className}`}
    >
      Direct
    </span>
  );
};
