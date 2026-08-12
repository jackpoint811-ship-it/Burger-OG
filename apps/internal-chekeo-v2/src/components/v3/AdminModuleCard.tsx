import type { ElementType } from 'react';

export interface AdminModuleCardProps {
  id: string;
  title: string;
  icon: ElementType | string;
  description: string;
  statusLabel?: string;
  onClick: () => void;
  isExternal?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export function AdminModuleCard({
  title,
  icon: Icon,
  description,
  statusLabel = 'Activo',
  onClick,
  isExternal = false,
  isFavorite = false,
  onToggleFavorite,
}: AdminModuleCardProps) {
  return (
    <div className="relative group w-full h-full">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 w-full h-full min-h-[175px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        {/* Icono central de 56px */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3">
          {typeof Icon === 'string' ? <span>{Icon}</span> : <Icon className="w-7 h-7" />}
        </div>

        <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5">
          {title}
          {isExternal && <span className="text-xs text-zinc-400">↗</span>}
        </h4>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed font-normal max-w-[240px]">
          {description}
        </p>

        {/* Pill de Status Centrado en la parte inferior */}
        {statusLabel && (
          <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {statusLabel}
          </span>
        )}
      </button>

      {/* Botón de Estrella para Favoritos */}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          title={isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
          className={`absolute top-3 right-3 p-1.5 rounded-xl text-sm transition-all z-10 ${
            isFavorite
              ? 'bg-amber-400/20 text-amber-500 hover:bg-amber-400/30'
              : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-60 hover:opacity-100'
          }`}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  );
}
