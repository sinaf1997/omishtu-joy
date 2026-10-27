import React from 'react';
import { CourseType } from '../../types/courses.js';

interface CourseTypeBadgeProps {
  type: CourseType;
  className?: string;
}

export const CourseTypeBadge: React.FC<CourseTypeBadgeProps> = ({ type, className = '' }) => {
  if (type === 'major') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 ${className}`}
      >
        Major
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/80 text-secondary-foreground border border-secondary ${className}`}
    >
      Elective
    </span>
  );
};
