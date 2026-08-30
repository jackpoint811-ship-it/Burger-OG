import * as React from 'react';
import { Sparkles, Lock, X } from 'lucide-react';
import { Dialog } from './dialog';
import { Button } from './button';

export interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  alternativeNotice?: string;
  badgeLabel?: string;
}

export function ComingSoonModal({
  open,
  onClose,
  title,
  description = 'Estamos terminando los últimos detalles para habilitar esta función. ¡Estará disponible muy pronto!',
  alternativeNotice,
  badgeLabel = 'Próximamente',
}: ComingSoonModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center p-2">
        {/* Icon & Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
          <Sparkles className="w-7 h-7 animate-pulse" aria-hidden="true" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30 mb-2">
          <Lock className="w-3 h-3" aria-hidden="true" /> {badgeLabel}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-black tracking-tight text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {description}
        </p>

        {/* Alternative notice */}
        {alternativeNotice && (
          <div className="w-full p-3 rounded-xl bg-surface-raised border border-line text-xs font-medium text-text-secondary text-left mb-5">
            <span className="font-bold text-text-primary block mb-0.5">ℹ️ Alternativa disponible:</span>
            {alternativeNotice}
          </div>
        )}

        {/* CTA */}
        <Button
          variant="default"
          onClick={onClose}
          className="w-full min-h-[44px] font-bold"
        >
          Entendido
        </Button>
      </div>
    </Dialog>
  );
}
