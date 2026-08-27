import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn } from './cn';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  ariaLabel?: string;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  size = 'default',
  ariaLabel = 'Cantidad',
  className,
}: QuantityStepperProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + step));
  };

  const isMin = value <= min;
  const isMax = value >= max;

  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'h-8 gap-1 p-0.5',
      btn: 'w-7 h-7 min-w-[28px] min-h-[28px] text-xs',
      text: 'min-w-[24px] text-xs font-bold',
      icon: 'w-3.5 h-3.5',
    },
    default: {
      container: 'h-11 gap-1.5 p-1',
      btn: 'w-9 h-9 min-w-[44px] min-h-[44px] text-sm',
      text: 'min-w-[32px] text-sm font-extrabold',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'h-13 gap-2 p-1.5',
      btn: 'w-11 h-11 min-w-[44px] min-h-[44px] text-base',
      text: 'min-w-[40px] text-base font-black',
      icon: 'w-5 h-5',
    },
  }[size];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl bg-surface-raised border border-line select-none',
        disabled && 'opacity-50 pointer-events-none',
        sizeClasses.container,
        className
      )}
    >
      <motion.button
        type="button"
        whileTap={shouldReduceMotion || isMin || disabled ? undefined : { scale: 0.9 }}
        onClick={handleDecrement}
        disabled={disabled || isMin}
        aria-label="Disminuir cantidad"
        className={cn(
          'flex items-center justify-center rounded-xl font-bold transition-colors cursor-pointer',
          'text-text-primary hover:bg-surface-card active:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isMin && 'text-text-muted opacity-40 cursor-not-allowed hover:bg-transparent',
          sizeClasses.btn
        )}
      >
        <Minus className={sizeClasses.icon} />
      </motion.button>

      <motion.span
        key={value}
        initial={shouldReduceMotion ? false : { scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
        className={cn('text-center tabular-nums text-text-primary', sizeClasses.text)}
        aria-live="polite"
      >
        {value}
      </motion.span>

      <motion.button
        type="button"
        whileTap={shouldReduceMotion || isMax || disabled ? undefined : { scale: 0.9 }}
        onClick={handleIncrement}
        disabled={disabled || isMax}
        aria-label="Aumentar cantidad"
        className={cn(
          'flex items-center justify-center rounded-xl font-bold transition-colors cursor-pointer',
          'text-text-primary hover:bg-surface-card active:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isMax && 'text-text-muted opacity-40 cursor-not-allowed hover:bg-transparent',
          sizeClasses.btn
        )}
      >
        <Plus className={sizeClasses.icon} />
      </motion.button>
    </div>
  );
}
