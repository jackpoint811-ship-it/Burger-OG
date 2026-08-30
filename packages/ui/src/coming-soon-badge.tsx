import * as React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from './cn';

export interface ComingSoonBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showSparkle?: boolean;
}

export function ComingSoonBadge({
  label = 'Próximamente',
  size = 'sm',
  showSparkle = false,
  className,
  ...props
}: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider select-none border',
        'bg-amber-500/10 text-amber-800 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showSparkle ? (
        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" aria-hidden="true" />
      ) : (
        <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}
