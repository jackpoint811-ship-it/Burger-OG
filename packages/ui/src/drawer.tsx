import * as React from 'react';
import { cn } from './cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-line bg-surface-card p-6 shadow-floating max-h-[90vh] overflow-y-auto',
          'animate-in slide-in-from-bottom duration-200',
          className
        )}
      >
        {/* Mobile drag pill */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" />

        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-raised transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
