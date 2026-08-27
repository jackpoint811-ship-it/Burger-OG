/**
 * CancelOrderModal.tsx — PR-V3-09
 *
 * Modal accesible para confirmación y captura de motivo de cancelación de pedidos.
 */

import React, { useState } from 'react';
import { AlertCircle, Ban, Loader2 } from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';
import { Textarea } from '@ui/textarea';
import type { OrderV2 } from '@config/index';
import { useUpdateOrderStatusMutation } from '../../features/orders';

const CANCEL_REASON_PRESETS = [
  'Cliente solicitó cancelación',
  'Fuera de horario operativo / torre cerrada',
  'Sin ingredientes / insumos disponibles',
  'Dirección o datos de contacto inaccesibles',
  'Pedido duplicado o de prueba',
  'Otro motivo',
];

export interface CancelOrderModalProps {
  order: OrderV2 | null;
  open: boolean;
  onClose: () => void;
}

export function CancelOrderModal({ order, open, onClose }: CancelOrderModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(CANCEL_REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateStatusMutation = useUpdateOrderStatusMutation();

  if (!order) return null;

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'Otro motivo') {
      setCustomReason('');
    }
  };

  const handleConfirmCancel = async () => {
    setErrorMsg(null);
    const finalReason =
      selectedPreset === 'Otro motivo'
        ? customReason.trim() || 'Cancelado por el operador'
        : selectedPreset;

    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        status: 'cancelled',
        reason: finalReason,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo cancelar el pedido. Inténtalo de nuevo.';
      setErrorMsg(message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-danger">
          <Ban className="w-5 h-5" />
          <span>Cancelar Pedido #{order.folio}</span>
        </div>
      }
      description={`¿Estás seguro de que deseas cancelar la orden de ${order.customerName}? Esta acción notificará el cambio en el historial.`}
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Motivos sugeridos (Presets) */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            Motivo de Cancelación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Motivo de cancelación">
            {CANCEL_REASON_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-left p-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger ${
                    isSelected
                      ? 'bg-danger/10 border-danger text-danger ring-1 ring-danger/30'
                      : 'bg-surface-raised border-line text-text-primary hover:border-line/80'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea para motivo personalizado */}
        {selectedPreset === 'Otro motivo' && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <label className="block text-xs font-semibold text-text-secondary">
              Especifica el motivo detallado
            </label>
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Escribe la razón de la cancelación…"
              className="min-h-[80px] text-xs"
              autoFocus
            />
          </div>
        )}

        {/* Mensaje de error si falla la mutación */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger-soft border border-danger/20 flex items-center gap-2 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={handleConfirmCancel}
            disabled={updateStatusMutation.isPending}
            className="min-w-[140px]"
          >
            {updateStatusMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cancelando…</span>
              </span>
            ) : (
              <span>Confirmar Cancelación</span>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
