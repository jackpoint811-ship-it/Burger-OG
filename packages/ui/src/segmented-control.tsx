import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from './cn';

export interface SegmentedControlItem {
  id: string;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items: SegmentedControlItem[];
  value: string;
  onChange: (id: string) => void;
  layoutId?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl({
  items,
  value,
  onChange,
  layoutId = 'segmented-indicator',
  size = 'default',
  fullWidth = false,
  className,
  ariaLabel = 'Opciones segmentadas',
}: SegmentedControlProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'h-8 p-0.5 text-xs',
    default: 'h-10 p-1 text-xs sm:text-sm',
    lg: 'h-12 p-1.5 text-sm sm:text-base',
  }[size];

  const itemSizeClasses = {
    sm: 'px-2.5 py-1 min-h-[28px]',
    default: 'px-3.5 py-1.5 min-h-[34px]',
    lg: 'px-4 py-2 min-h-[40px]',
  }[size];

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-2xl bg-surface-raised border border-line p-1 select-none overflow-x-auto no-scrollbar',
        fullWidth && 'w-full flex',
        sizeClasses,
        className
      )}
    >
      {items.map((item) => {
        const isSelected = item.id === value;

        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 font-bold transition-colors rounded-xl z-10 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              fullWidth ? 'flex-1' : 'shrink-0',
              isSelected
                ? 'text-text-primary dark:text-white'
                : 'text-text-secondary hover:text-text-primary',
              item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
              itemSizeClasses
            )}
          >
            {/* Animated Active Pill Indicator */}
            {isSelected && (
              <motion.div
                layoutId={shouldReduceMotion ? undefined : layoutId}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-surface-card shadow-xs border border-line/60 z-[-1]"
              />
            )}

            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="truncate">{item.label}</span>

            {item.count !== undefined && (
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums',
                  isSelected
                    ? 'bg-accent text-white'
                    : 'bg-surface-card border border-line text-text-secondary'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
