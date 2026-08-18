import * as React from 'react';
import { cn } from './cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors resize-y',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
