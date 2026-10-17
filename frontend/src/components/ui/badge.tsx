import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-[#5B21B6]',
        secondary: 'border-border bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border-border text-foreground bg-card',
        destructive: 'border-[#DDD6FE] bg-accent text-[#5B21B6] font-medium',
        success: 'border-border bg-secondary text-primary font-medium',
        subtle: 'border-transparent bg-[#EDE9FE] text-[#5B21B6] font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
