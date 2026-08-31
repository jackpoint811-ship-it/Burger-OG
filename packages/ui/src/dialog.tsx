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
  const titleId = React.useId();
  const descId = React.useId();

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
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative z-50 w-full max-h-[min(90vh,calc(100dvh-2rem))] flex flex-col rounded-3xl border border-line bg-surface-card p-5 sm:p-6 shadow-floating overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {(title || description) && (
          <div className="mb-4 shrink-0">
            {title && <h2 id={titleId} className="text-lg font-black text-text-primary">{title}</h2>}
            {description && <p id={descId} className="mt-1 text-xs text-text-secondary">{description}</p>}
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 pr-1 -mr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
