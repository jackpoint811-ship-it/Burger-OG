import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  enableDrag?: boolean;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
  enableDrag = true,
}: DrawerProps) {
  const shouldReduceMotion = useReducedMotion();
  const titleId = React.useId();
  const descId = React.useId();

  // Escape key listener
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Handle drag to dismiss
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Animated Drawer / Sheet Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0.5 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            drag={enableDrag && !shouldReduceMotion ? 'y' : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative z-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-line bg-surface-card p-5 sm:p-6 shadow-floating max-h-[90vh] overflow-y-auto',
              'pb-[max(1.5rem,env(safe-area-inset-bottom))]',
              className
            )}
          >
            {/* Mobile drag pill / Grab handle */}
            {enableDrag && (
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line/80 sm:hidden cursor-grab active:cursor-grabbing" />
            )}

            {/* Header: Title, Description & Close Button */}
            {title && (
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-text-primary">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="text-xs text-text-muted mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
