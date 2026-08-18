import * as React from 'react';
import { cn } from './cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full rounded-2xl border border-line bg-surface-card p-6 shadow-floating overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && <h2 className="text-lg font-bold text-text-primary">{title}</h2>}
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
