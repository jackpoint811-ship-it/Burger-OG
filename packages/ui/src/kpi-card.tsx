import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from './cn';

export interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  delta?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  badge?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'accent' | 'warning' | 'info' | 'success';
  className?: string;
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  delta,
  badge,
  isActive = false,
  onClick,
  variant = 'default',
  className,
  isLoading = false,
}: KpiCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isClickable = Boolean(onClick);

  const variantStyles = {
    default: {
      card: 'bg-surface-card border-line hover:border-text-secondary/30',
      iconBox: 'bg-surface-raised text-text-primary',
    },
    accent: {
      card: 'bg-accent/5 border-accent/20 hover:border-accent/40',
      iconBox: 'bg-accent/15 text-accent',
    },
    warning: {
      card: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
      iconBox: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    info: {
      card: 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
      iconBox: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    },
    success: {
      card: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
      iconBox: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
  }[variant];

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-line bg-surface-card p-4 sm:p-5 shadow-card', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-24 bg-surface-raised animate-pulse rounded-md" />
          <div className="h-8 w-8 bg-surface-raised animate-pulse rounded-xl" />
        </div>
        <div className="h-7 w-28 bg-surface-raised animate-pulse rounded-lg mb-2" />
        <div className="h-3 w-36 bg-surface-raised animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={isClickable && !shouldReduceMotion ? { y: -2 } : undefined}
      whileTap={isClickable && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-card transition-all duration-200',
        variantStyles.card,
        isClickable && 'cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isActive && 'ring-2 ring-accent border-accent shadow-panel',
        className
      )}
    >
      {/* Header: Title & Icon/Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary line-clamp-1">
          {title}
        </span>
        {badge ? (
          <div>{badge}</div>
        ) : icon ? (
          <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl shrink-0', variantStyles.iconBox)}>
            {icon}
          </div>
        ) : null}
      </div>

      {/* Main Metric Value */}
      <div className="my-1">
        <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight tabular-nums">
          {value}
        </div>
      </div>

      {/* Footer: Subtitle / Delta */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-line/50 text-xs">
        {subtitle && (
          <span className="text-text-muted font-medium line-clamp-1">
            {subtitle}
          </span>
        )}

        {delta && (
          <div
            className={cn(
              'inline-flex items-center gap-1 font-bold shrink-0 ml-auto px-1.5 py-0.5 rounded-md text-[11px]',
              delta.isPositive !== false
                ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                : 'text-red-700 bg-red-500/10 dark:text-red-400'
            )}
          >
            {delta.isPositive !== false ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{delta.value}</span>
            {delta.label && <span className="opacity-75 font-normal">{delta.label}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
