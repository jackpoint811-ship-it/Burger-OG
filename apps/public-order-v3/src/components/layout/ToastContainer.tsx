import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore, selectToasts } from '../../stores';

export function ToastContainer() {
  const toasts = useUIStore(selectToasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const shouldReduceMotion = useReducedMotion();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              role="status"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-neutral-900/95 text-white shadow-floating backdrop-blur-md border border-neutral-700/50 w-full"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-accent-dark shrink-0" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
                <p className="text-xs font-bold text-gray-100 truncate leading-snug">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 -mr-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
