import React from 'react';
import { Sparkles } from 'lucide-react';

interface SampleDataBadgeProps {
  className?: string;
}

export const SampleDataBadge: React.FC<SampleDataBadgeProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/80 text-accent-foreground border border-border shrink-0 select-none ${className}`}
      title="This section is currently populated with sample preview data"
    >
      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
      <span>Sample data</span>
    </span>
  );
};
