import * as React from 'react';
import { cn } from './cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', disabled, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-accent text-white hover:bg-accent/90 shadow-sm active:scale-[0.98]',
      secondary: 'bg-surface-raised text-text-primary hover:bg-surface-raised/80 border border-line active:scale-[0.98]',
      outline: 'border border-line bg-transparent text-text-primary hover:bg-surface-raised active:scale-[0.98]',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
      ghost: 'bg-transparent text-text-primary hover:bg-surface-raised active:scale-[0.98]',
      link: 'text-accent underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs rounded-lg min-h-[36px]',
      md: 'h-10 px-4 py-2 text-sm rounded-xl min-h-[44px]',
      lg: 'h-12 px-6 text-base rounded-2xl min-h-[48px]',
      icon: 'h-11 w-11 p-0 rounded-xl min-h-[44px] min-w-[44px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          variant !== 'link' && sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
