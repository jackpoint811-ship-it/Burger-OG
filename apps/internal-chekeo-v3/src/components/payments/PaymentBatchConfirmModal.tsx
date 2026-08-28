/**
 * PaymentBatchConfirmModal.tsx — Chekeo V3 Pagos Refinement
 *
 * Modal de confirmación preventivo para operaciones masivas de cobro:
 * - Evita validaciones o reversiones masivas accidentales.
 * - Muestra el desglose de total de pedidos e importe monetario acumulado.
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';
import { formatCurrency } from '../../features/orders';

export interface PaymentBatchConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: 'validate' | 'revert';
  totalCount: number;
  totalAmount: number;
  busy?: boolean;
}

export function PaymentBatchConfirmModal({
  open,
  onClose,
  onConfirm,
  actionType,
  totalCount,
  totalAmount,
  busy = false,
}: PaymentBatchConfirmModalProps) {
  const isValidate = actionType === 'validate';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      className="p-0 overflow-hidden bg-surface-card border border-line shadow-floating rounded-3xl"
    >
      {/* Cabecera */}
      <div className="p-4 sm:p-5 border-b border-line bg-surface-raised flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
              isValidate
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isValidate ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary">
              {isValidate ? 'Confirmar Cobros en Lote' : 'Confirmar Reversión a Por confirmar'}
            </h3>
            <p className="text-xs text-text-secondary font-medium">
              {isValidate
                ? 'Marcar múltiples pagos como confirmados'
                : 'Revertir estado de cobro a por confirmar'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          title="Cerrar modal"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-bold">Comandas afectadas:</span>
            <strong className="text-text-primary text-sm font-black">{totalCount} pedidos</strong>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-line/60">
            <span className="text-text-muted font-bold">Monto total consolidado:</span>
            <strong className="text-accent text-base font-black">{formatCurrency(totalAmount)}</strong>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {isValidate
            ? 'Los pagos seleccionados se marcarán como pagados y confirmados en el sistema y se actualizará el corte financiero en tiempo real.'
            : 'Los pagos seleccionados volverán a estado por confirmar en la cola de cobranza.'}
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-5 border-t border-line bg-surface-raised flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={busy}
          className="text-xs font-bold cursor-pointer"
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onConfirm}
          disabled={busy}
          className={`text-xs font-bold shadow-xs cursor-pointer ${
            isValidate
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : isValidate ? (
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          ) : (
            <Clock className="w-3.5 h-3.5 mr-1.5" />
          )}
          <span>{isValidate ? `Confirmar ${totalCount} Cobros` : `Revertir ${totalCount} Cobros`}</span>
        </Button>
      </div>
    </Dialog>
  );
}
