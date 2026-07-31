import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export interface ToastMessage {
  id: string;
  emoji: string;
  message: string;
}

interface CatalogToastProps {
  toast: ToastMessage | null;
  hasCartBar?: boolean;
}

export function CatalogToast({ toast, hasCartBar = true }: CatalogToastProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"confirming" | "done">("confirming");

  useEffect(() => {
    if (toast) {
      setPhase("confirming");
      const timer = setTimeout(() => {
        setPhase("done");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0, scale: 0.95 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          style={{
            position: "fixed",
            bottom: hasCartBar ? "76px" : "20px",
            left: "16px",
            right: "16px",
            maxWidth: "calc(var(--catalog-max-width, 768px) - 32px)",
            margin: "0 auto",
            zIndex: 45,
            backgroundColor: "var(--color-surface, #FFFFFF)",
            color: "var(--color-text-primary, #1C1917)",
            border: "1px solid var(--color-line-strong, rgba(0,0,0,0.12))",
            borderRadius: "16px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            backdropFilter: "blur(12px)",
            pointerEvents: "none",
          }}
        >
          {phase === "confirming" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center" }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Procesando...</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
                role="img"
                aria-hidden="true"
              >
                {toast.emoji}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {toast.message}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
