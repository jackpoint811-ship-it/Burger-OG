import * as React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from './cn';
import { ComingSoonBadge } from './coming-soon-badge';

export interface ComingSoonGateProps {
  featureName: string;
  description?: string;
  status?: 'enabled' | 'coming-soon' | 'disabled';
  children: React.ReactNode;
  mode?: 'replace' | 'overlay' | 'banner';
  className?: string;
}

export function ComingSoonGate({
  featureName,
  description = 'Estamos preparando esta herramienta para optimizar la operación. Estará disponible en la siguiente actualización.',
  status = 'enabled',
  children,
  mode = 'replace',
  className,
}: ComingSoonGateProps) {
  if (status === 'enabled') {
    return <>{children}</>;
  }

  if (status === 'disabled') {
    return null;
  }

  // Modo Banner: Muestra los children pero con un banner advertencia arriba
  if (mode === 'banner') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {featureName} (Próximamente)
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                {description}
              </p>
            </div>
          </div>
          <ComingSoonBadge size="sm" />
        </div>
        <div className="opacity-75">{children}</div>
      </div>
    );
  }

  // Modo Overlay: Desenfoca los children y coloca un candado en el centro
  if (mode === 'overlay') {
    return (
      <div className={cn('relative rounded-2xl overflow-hidden', className)}>
        <div className="opacity-30 pointer-events-none filter blur-[1px] select-none" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-surface/50 backdrop-blur-[2px] text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 shadow-sm">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <ComingSoonBadge size="md" className="mb-2" />
          <h4 className="text-sm font-bold text-text-primary mb-1">{featureName}</h4>
          <p className="text-xs text-text-secondary max-w-xs">{description}</p>
        </div>
      </div>
    );
  }

  // Modo Replace (Por defecto): Reemplaza la vista por un estado vacío claro y elegante
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-line bg-surface-card shadow-card min-h-[260px]',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
        <Sparkles className="w-7 h-7 animate-pulse text-amber-500" aria-hidden="true" />
      </div>
      <ComingSoonBadge size="md" className="mb-3" />
      <h3 className="text-base font-extrabold text-text-primary tracking-tight mb-1.5">
        {featureName}
      </h3>
      <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
