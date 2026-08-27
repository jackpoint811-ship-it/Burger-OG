/**
 * BatchActionBar.tsx — Chekeo V3
 *
 * Barra flotante inferior reactiva para operaciones en lote (limpieza de turno,
 * archivado y restauración masiva).
 */

import React from 'react';
import {
  Archive,
  RotateCcw,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@ui/button';

export interface BatchActionBarProps {
  selectedCount: number;
  activeCount: number;
  cancelledCount: number;
  isArchivedView?: boolean;
  onClearSelection: () => void;
  onBatchArchive?: () => void;
  onBatchRestore?: () => void;
  busy?: boolean;
}

export function BatchActionBar({
  selectedCount,
  activeCount,
  cancelledCount,
  isArchivedView = false,
  onClearSelection,
  onBatchArchive,
  onBatchRestore,
  busy = false,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Acciones en lote para pedidos seleccionados"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-card/95 backdrop-blur-md border border-accent/30 rounded-3xl shadow-floating max-w-xl w-[92%] sm:w-auto min-w-[320px] sm:min-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Indicador de Selección */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <p className="text-xs font-black text-text-primary">
            {selectedCount} {selectedCount === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}
          </p>
        </div>

        {!isArchivedView && selectedCount > 0 && (
          <span className="text-[11px] font-bold text-text-muted">
            ({cancelledCount} cancelados, {activeCount} activos)
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Botón de Deseleccionar */}
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onClearSelection}
          disabled={busy}
          className="text-xs font-bold text-text-secondary hover:text-text-primary min-h-11 h-11 px-3 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          title="Deseleccionar todos"
        >
          <X className="w-4 h-4 mr-1" />
          <span>Limpiar</span>
        </Button>

        {/* Botón Archivar en lote */}
        {!isArchivedView && onBatchArchive && (
          <Button
            type="button"
            variant="default"
            size="md"
            onClick={onBatchArchive}
            disabled={busy}
            className="text-xs font-extrabold min-h-11 h-11 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Archive className="w-4 h-4 mr-1.5" />
            )}
            <span>Archivar ({selectedCount})</span>
          </Button>
        )}

        {/* Botón Restaurar en lote */}
        {isArchivedView && onBatchRestore && (
          <Button
            type="button"
            variant="default"
            size="md"
            onClick={onBatchRestore}
            disabled={busy}
            className="text-xs font-extrabold min-h-11 h-11 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-1.5" />
            )}
            <span>Restaurar ({selectedCount})</span>
          </Button>
        )}
      </div>
    </div>
  );
}
