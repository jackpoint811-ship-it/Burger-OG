/**
 * KitchenTicketCard.tsx — Refinamiento KDS V3
 *
 * Comanda de cocina de alto contraste legible a distancia para tablets y pantallas KDS:
 * - Folio grande y ubicación estricta ("Torre GGA" o "Torre Valcob")
 * - División nítida entre ítems numerados (Ítem #1, Ítem #2...)
 * - Nombres exactos de recetas de papas/guarniciones y bebidas con micro-badge reducido [combo]
 * - Modificadores 1 por 1 en renglones verticales individuales
 * - Nota de cocina fija en la base de la tarjeta del ítem
 * - Completado granular ítem por ítem: la orden solo se completa cuando el 100% de los ítems
 *   (Plancha + Side Quest) estén confirmados
 * - Botones concisos con texto "Listo"
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  MapPin,
  FileText,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@ui/button';
import {
  formatKitchenLocation,
  useKitchenItemTracking,
  type KitchenTicket,
  type KitchenProductionUnit,
} from '../../features/kitchen';

export interface KitchenTicketCardProps {
  ticket: KitchenTicket;
  laneMode?: 'prep' | 'sideQuest';
  onAdvance: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  onRevert?: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  isUpdating?: boolean;
}

export function KitchenTicketCard({
  ticket,
  laneMode,
  onAdvance,
  onRevert,
  isUpdating = false,
}: KitchenTicketCardProps) {
  const [localBusy, setLocalBusy] = useState(false);
  const { isUnitDone, toggleUnitDone, getTicketProgress } = useKitchenItemTracking();

  const progress = getTicketProgress(ticket);
  const isTicketFullyDone = progress.isFullyDone;

  const handleAdvance = async () => {
    try {
      setLocalBusy(true);
      await onAdvance(ticket.id, ticket.status);
    } finally {
      setLocalBusy(false);
    }
  };

  const handleRevert = async () => {
    if (!onRevert) return;
    try {
      setLocalBusy(true);
      await onRevert(ticket.id, ticket.status);
    } finally {
      setLocalBusy(false);
    }
  };

  // Filtrar unidades de producción por carril operativo activo
  const displayedUnits = (ticket.productionUnits || []).filter((unit) => {
    if (!laneMode) return true;
    return unit.station === laneMode;
  });

  const locationDisplay = formatKitchenLocation(ticket.location);

  return (
    <div className="bg-surface-card rounded-3xl p-4 sm:p-5 border-2 border-line shadow-card flex flex-col justify-between transition-all hover:border-accent/40">
      {/* ─── Encabezado de Comanda KDS ────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
          <div>
            {/* Folio Grande & Ubicación Estricta */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
                {ticket.folio}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-raised border border-line text-xs font-black text-text-primary">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{locationDisplay}</span>
              </span>
              {ticket.scheduledDate ? (
                <span className="px-2 py-0.5 rounded-lg bg-accent/15 text-accent font-extrabold text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{ticket.scheduledDate}</span>
                </span>
              ) : null}
            </div>

            {/* Cliente */}
            <div className="text-xs font-extrabold text-text-secondary mt-1">
              <span>{ticket.customerName}</span>
            </div>
          </div>

          {/* Badge de Progreso de Ítems */}
          <div className="px-2.5 py-1 rounded-xl bg-surface-raised border border-line text-[11px] font-black text-text-primary shrink-0 select-none">
            {progress.completedUnits}/{progress.totalUnits} listos
          </div>
        </div>

        {/* Nota General del Pedido si existe */}
        {ticket.orderNote ? (
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-start gap-1.5">
            <FileText className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="break-words">
              <span className="font-extrabold uppercase tracking-wide mr-1">Nota pedido:</span>
              <span>{ticket.orderNote}</span>
            </div>
          </div>
        ) : null}

        {/* ─── Lista de Unidades de Producción Ítem por Ítem ───────────────────── */}
        <div className="space-y-3.5">
          {displayedUnits.length === 0 ? (
            <div className="p-4 rounded-2xl bg-surface-raised border border-line text-center text-xs font-bold text-text-muted">
              {laneMode === 'prep'
                ? 'Esta orden no contiene hamburguesas para plancha.'
                : 'Esta orden no contiene complementos para side quest.'}
            </div>
          ) : (
            displayedUnits.map((unit) => {
              const isDone = isUnitDone(unit.unitKey);

              return (
                <div
                  key={unit.unitKey}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all space-y-2.5 ${
                    isDone
                      ? 'bg-emerald-500/5 border-emerald-500/30 opacity-80'
                      : 'bg-surface-raised border-line shadow-xs'
                  }`}
                >
                  {/* Encabezado del Ítem: Número, Nombre y Micro-badge de combo */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-surface-card border border-line text-[10px] font-black uppercase text-text-muted">
                        Ítem #{unit.itemIndex}
                      </span>
                      {unit.isFromCombo ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider">
                          combo
                        </span>
                      ) : null}
                    </div>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Listo</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Nombre del Producto con Emoji Correspondiente */}
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-text-primary leading-tight">
                      {unit.itemKind === 'burger' && '🍔 '}
                      {unit.itemKind === 'garnish' && '🍟 '}
                      {unit.itemKind === 'drink' && '🥤 '}
                      {unit.itemKind === 'extra' && '🥫 '}
                      {unit.name}
                    </span>
                  </div>

                  {/* 🔴 Remociones: Listadas 1 por 1 en renglones verticales */}
                  {unit.removedIngredients && unit.removedIngredients.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {unit.removedIngredients.map((mod, mIdx) => (
                        <div
                          key={mIdx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black tracking-wide shadow-xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse" />
                          <span>SIN {mod.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* 🟢 Extras Añadidos: Listados 1 por 1 en renglones verticales */}
                  {unit.extras && unit.extras.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {unit.extras.map((extra, eIdx) => (
                        <div
                          key={eIdx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black tracking-wide shadow-xs"
                        >
                          <span>🟢</span>
                          <span>+EXTRA {extra.name.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* ✓ Receta Original si no tiene modificaciones */}
                  {unit.itemKind === 'burger' &&
                  (!unit.removedIngredients || unit.removedIngredients.length === 0) &&
                  (!unit.extras || unit.extras.length === 0) ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                      <span>✓</span>
                      <span>Receta Original</span>
                    </div>
                  ) : null}

                  {/* Nota Fija en la Base del Ítem */}
                  {unit.burgerNote ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2">
                      <FileText className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="break-words">
                        <span className="font-extrabold uppercase text-[10px] block tracking-wider">
                          Nota:
                        </span>
                        <span>{unit.burgerNote}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Botón Individual de Completado (1-Tap con touch target >= 44px) */}
                  <div className="pt-2 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => toggleUnitDone(unit.unitKey)}
                      className={`w-full min-h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                        isDone
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          : 'bg-surface-card hover:bg-surface-raised border-2 border-line text-text-primary active:scale-[0.98]'
                      }`}
                      aria-pressed={isDone}
                      aria-label={`Marcar ${unit.name} como listo`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Listo</span>
                        </>
                      ) : (
                        <span>Listo</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Botón Global de la Comanda (Listo) con Bloqueo de Incompletos ──────── */}
      <div className="pt-4 border-t border-line mt-4 space-y-2">
        {ticket.status !== 'new' && onRevert ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={localBusy || isUpdating}
              onClick={handleRevert}
              className="h-12 w-12 rounded-2xl shrink-0 p-0 border-line text-text-muted hover:text-text-primary cursor-pointer"
              title="Retroceder comanda"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <button
              type="button"
              disabled={localBusy || isUpdating || !isTicketFullyDone}
              onClick={handleAdvance}
              className={`flex-1 h-12 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isTicketFullyDone
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.98]'
                  : 'bg-surface-raised border-2 border-line text-text-muted opacity-60 cursor-not-allowed'
              }`}
            >
              {localBusy || isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Actualizando…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Listo</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              disabled={localBusy || isUpdating || !isTicketFullyDone}
              onClick={handleAdvance}
              className={`w-full h-12 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isTicketFullyDone
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.98]'
                  : 'bg-surface-raised border-2 border-line text-text-muted opacity-60 cursor-not-allowed'
              }`}
            >
              {localBusy || isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Actualizando…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Listo</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Indicador Informativo si la comanda no está 100% lista */}
        {!isTicketFullyDone && (
          <div className="text-center text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
            {!progress.isPrepDone && !progress.isSideQuestDone && (
              <span>Faltan ítems en Plancha y en Side Quest ({progress.completedUnits}/{progress.totalUnits})</span>
            )}
            {progress.isPrepDone && !progress.isSideQuestDone && (
              <span>Plancha lista · Esperando Side Quest ({progress.sideCompleted}/{progress.sideTotal})</span>
            )}
            {!progress.isPrepDone && progress.isSideQuestDone && (
              <span>Side Quest listo · Esperando Plancha ({progress.prepCompleted}/{progress.prepTotal})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
