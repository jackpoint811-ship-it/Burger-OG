import * as React from 'react';
import { cn } from './cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-accent/15 text-accent border-accent/20',
    secondary: 'bg-surface-raised text-text-secondary border-line',
    outline: 'border-line text-text-primary bg-transparent',
    destructive: 'bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400',
    success: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider select-none',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
