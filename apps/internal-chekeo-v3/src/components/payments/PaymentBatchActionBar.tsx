/**
 * PaymentBatchActionBar.tsx — Chekeo V3 Pagos Refinement
 *
 * Barra flotante inferior de acciones en lote para conciliación masiva:
 * - Aparece suavemente al seleccionar 1 o más pedidos.
 * - Desglose de seleccionados y monto acumulado.
 * - Acciones: Validar Pagos en Lote, Revertir a Pendiente y Copiar Resumen de Arqueo.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  X,
  Loader2,
  Check,
  DollarSign,
} from 'lucide-react';
import { Button } from '@ui/button';
import { formatCurrency } from '../../features/orders';

export interface PaymentBatchActionBarProps {
  selectedCount: number;
  selectedTotalAmount: number;
  pendingCount: number;
  paidCount: number;
  onClearSelection: () => void;
  onBatchValidate: () => void;
  onBatchRevert: () => void;
  onCopySummary: () => void;
  busy?: boolean;
}

export function PaymentBatchActionBar({
  selectedCount,
  selectedTotalAmount,
  pendingCount,
  paidCount,
  onClearSelection,
  onBatchValidate,
  onBatchRevert,
  onCopySummary,
  busy = false,
}: PaymentBatchActionBarProps) {
  const [copied, setCopied] = useState(false);

  if (selectedCount === 0) return null;

  const handleCopy = () => {
    onCopySummary();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-surface-card/95 backdrop-blur-md border border-line rounded-3xl p-3 sm:p-4 shadow-floating flex flex-wrap items-center justify-between gap-3">
        {/* Info de selección y monto */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-accent text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            {selectedCount}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-text-primary">
                {selectedCount} {selectedCount === 1 ? 'comanda seleccionada' : 'comandas seleccionadas'}
              </span>
              <span className="text-xs font-black text-accent">
                ({formatCurrency(selectedTotalAmount)})
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              {pendingCount} por confirmar · {paidCount} pagadas
            </p>
          </div>
        </div>

        {/* Botones de acción masiva */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Botón: Copiar Resumen de Arqueo */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={busy}
            className="text-xs font-bold h-9 px-3 rounded-xl border-line cursor-pointer"
            title="Copiar desglose de pagos al portapapeles"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-accent" />
                <span className="text-accent font-extrabold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Copiar Arqueo</span>
                <span className="sm:hidden">Copiar</span>
              </>
            )}
          </Button>

          {/* Botón: Revertir a Por confirmar (si hay pagadas) */}
          {paidCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBatchRevert}
              disabled={busy}
              className="text-xs font-bold h-9 px-3 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              title="Marcar como por confirmar"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>Por confirmar</span>
            </Button>
          )}

          {/* Botón: Confirmar Pagos en Lote */}
          {pendingCount > 0 && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onBatchValidate}
              disabled={busy}
              className="text-xs font-bold h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              title="Marcar como pagadas y confirmadas"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-1" />
              )}
              <span>Confirmar ({pendingCount})</span>
            </Button>
          )}

          {/* Botón: Limpiar selección */}
          <button
            type="button"
            onClick={onClearSelection}
            disabled={busy}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            title="Deseleccionar todos"
            aria-label="Deseleccionar todos"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
