import type { ElementType } from 'react';

export interface AdminModuleCardProps {
  id: string;
  title: string;
  icon: ElementType | string;
  description: string;
  statusLabel?: string;
  onClick: () => void;
  isExternal?: boolean;
}

export function AdminModuleCard({
  title,
  icon: Icon,
  description,
  statusLabel = 'Activo',
  onClick,
  isExternal = false,
}: AdminModuleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 text-left w-full h-full min-h-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
    >
      <div>
        {/* Header con Ícono y Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
            {typeof Icon === 'string' ? (
              <span>{Icon}</span>
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>

          {statusLabel && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {statusLabel}
            </span>
          )}
        </div>

        {/* Título y Descripción Profesional */}
        <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
          {title}
          {isExternal && <span className="text-xs text-zinc-400">↗</span>}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Footer / Action hint */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        <span>{isExternal ? 'Abrir enlace' : 'Configurar módulo'}</span>
        <span className="text-sm font-black group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
    </button>
  );
}
