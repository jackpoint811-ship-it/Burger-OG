import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from './cn';

export interface LiveTimerBadgeProps {
  createdAt: string | number | Date;
  warningThresholdMinutes?: number;
  urgentThresholdMinutes?: number;
  showIcon?: boolean;
  completed?: boolean;
  className?: string;
}

export function LiveTimerBadge({
  createdAt,
  warningThresholdMinutes = 10,
  urgentThresholdMinutes = 20,
  showIcon = true,
  completed = false,
  className,
}: LiveTimerBadgeProps) {
  const [elapsedMinutes, setElapsedMinutes] = React.useState<number>(() => {
    return calculateElapsedMinutes(createdAt);
  });

  React.useEffect(() => {
    if (completed) return;

    // Calcular de inmediato y programar intervalo cada 15 segundos
    setElapsedMinutes(calculateElapsedMinutes(createdAt));
    const interval = setInterval(() => {
      setElapsedMinutes(calculateElapsedMinutes(createdAt));
    }, 15000);

    return () => clearInterval(interval);
  }, [createdAt, completed]);

  if (completed) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
          'bg-surface-raised text-text-muted border border-line',
          className
        )}
      >
        {showIcon && <Clock className="w-3 h-3" />}
        <span>Completada</span>
      </span>
    );
  }

  // Determinar nivel de urgencia
  const isUrgent = elapsedMinutes >= urgentThresholdMinutes;
  const isWarning = !isUrgent && elapsedMinutes >= warningThresholdMinutes;

  const colorStyles = isUrgent
    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-extrabold animate-pulse'
    : isWarning
    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border tabular-nums transition-colors',
        colorStyles,
        className
      )}
      title={`Comanda recibida hace ${elapsedMinutes} minutos`}
    >
      {showIcon && <Clock className="w-3 h-3 shrink-0" />}
      <span>{elapsedMinutes}m</span>
    </span>
  );
}

function calculateElapsedMinutes(createdAt: string | number | Date): number {
  if (!createdAt) return 0;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return 0;
  const diffMs = Math.max(0, Date.now() - createdTime);
  return Math.floor(diffMs / 60000);
}
