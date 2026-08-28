/**
 * BatchConfirmModal.tsx — Chekeo V3
 *
 * Modal de confirmación seguro para el archivado en lote y limpieza de turno.
 */

import React from 'react';
import { AlertTriangle, Archive, Loader2 } from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';

export interface BatchConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalCount: number;
  activeCount: number;
  cancelledCount: number;
  busy?: boolean;
}

export function BatchConfirmModal({
  open,
  onClose,
  onConfirm,
  totalCount,
  activeCount,
  cancelledCount,
  busy = false,
}: BatchConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <Archive className="w-5 h-5" />
          <span>Confirmar Archivado en Lote ({totalCount})</span>
        </div>
      }
      description="Los pedidos seleccionados se moverán a la sección de Archivados (Soft-Delete) para limpiar el tablero de operaciones."
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Advertencia si hay pedidos activos no terminados */}
        {activeCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                ¡Atención! {activeCount} de las {totalCount} órdenes aún están activas (no canceladas).
              </p>
              <p className="opacity-90">
                Al archivarlas, se marcarán como canceladas por limpieza de turno y se removerán de la cola de pedidos y cocina.
              </p>
            </div>
          </div>
        )}

        {activeCount === 0 && (
          <div className="p-3.5 rounded-2xl bg-surface-raised border border-line text-xs text-text-secondary">
            Se archivarán <strong>{totalCount} órdenes</strong> previamente canceladas o terminadas. Podrás consultarlas o restaurarlas en cualquier momento desde la pestaña <em>"Archivados"</em>.
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={onConfirm}
            disabled={busy}
            className="min-w-[150px] bg-rose-600 hover:bg-rose-700 text-white"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Archivando…</span>
              </span>
            ) : (
              <span>Confirmar Archivado</span>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
