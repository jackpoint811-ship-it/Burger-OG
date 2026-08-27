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

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  MapPin,
  FileText,
  Loader2,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@ui/button';
import {
  formatKitchenLocation,
  formatKitchenExtraLabel,
  formatKitchenRemovalLabel,
  useKitchenItemTracking,
  type KitchenTicket,
  type KitchenProductionUnit,
} from '../../features/kitchen';

function isUnitCustomized(unit: KitchenProductionUnit): boolean {
  const hasRemovals = Boolean(unit.removedIngredients && unit.removedIngredients.length > 0);
  const hasExtras = Boolean(unit.extras && unit.extras.length > 0);
  const hasNote = Boolean(unit.burgerNote?.trim());
  return hasRemovals || hasExtras || hasNote;
}

function OrderNoteAccordion({ note }: { note?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const trimmed = note?.trim();
  if (!trimmed) return null;

  const isLong = trimmed.length > 40;

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-amber-900 dark:text-amber-200 text-xs transition-all">
      {isLong ? (
        <div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-left cursor-pointer font-black uppercase text-[11px] tracking-wide text-amber-800 dark:text-amber-300 select-none"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>📝 NOTA DEL PEDIDO</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
              <span>{isExpanded ? 'Ocultar' : 'Desplegar'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
          {isExpanded && (
            <p className="mt-2 text-xs font-bold leading-relaxed break-words text-amber-900 dark:text-amber-100">
              {trimmed}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2 break-words">
          <FileText className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="leading-snug">
            <span className="font-extrabold uppercase tracking-wide mr-1.5 text-amber-800 dark:text-amber-300 text-[11px]">
              Nota pedido:
            </span>
            <span className="font-bold text-amber-900 dark:text-amber-100">{trimmed}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemNoteAccordion({ note }: { note?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const trimmed = note?.trim();
  if (!trimmed) return null;

  const isLong = trimmed.length > 45;

  return (
    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all">
      {isLong ? (
        <div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-left cursor-pointer font-black uppercase text-[10px] tracking-wider text-amber-900 dark:text-amber-200 select-none"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>📝 NOTA:</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
              <span>{isExpanded ? 'Ocultar' : 'Ver'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>
          {isExpanded && (
            <p className="mt-1.5 text-xs font-bold leading-relaxed break-words text-amber-900 dark:text-amber-100">
              {trimmed}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-1.5 break-words">
          <FileText className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase text-[10px] tracking-wider mr-1 text-amber-800 dark:text-amber-300">
              Nota:
            </span>
            <span className="text-amber-900 dark:text-amber-100 font-bold">{trimmed}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export interface KitchenTicketCardProps {
  ticket: KitchenTicket;
  laneMode?: 'prep' | 'sideQuest';
  onAdvance: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  onRevert?: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  onCompleteStation?: (ticketId: string, station: 'prep' | 'sideQuest') => Promise<void>;
  isUpdating?: boolean;
}

export function KitchenTicketCard({
  ticket,
  laneMode,
  onAdvance,
  onRevert,
  onCompleteStation,
  isUpdating = false,
}: KitchenTicketCardProps) {
  const [localBusy, setLocalBusy] = useState(false);
  const { isUnitDone, toggleUnitDone, getTicketProgress } = useKitchenItemTracking();

  // Filtrar unidades de producción por carril operativo activo
  const displayedUnits = (ticket.productionUnits || []).filter((unit) => {
    if (!laneMode) return true;
    return unit.station === laneMode;
  });

  // Si hay más de 1 ítem, gestionar cuál ítem está desplegado en foco
  const [expandedUnitKey, setExpandedUnitKey] = useState<string | null>(() => {
    if (displayedUnits.length <= 1) return null;
    const firstPending = displayedUnits.find((u) => !isUnitDone(u.unitKey));
    return firstPending ? firstPending.unitKey : displayedUnits[0]?.unitKey || null;
  });

  // Sincronizar ítem expandido al cambiar de ticket o longitud de lista
  useEffect(() => {
    if (displayedUnits.length > 1) {
      const firstPending = displayedUnits.find((u) => !isUnitDone(u.unitKey));
      setExpandedUnitKey(firstPending ? firstPending.unitKey : displayedUnits[0]?.unitKey || null);
    } else {
      setExpandedUnitKey(null);
    }
  }, [ticket.id, displayedUnits.length]);

  const progress = getTicketProgress(ticket);
  const isStationReady =
    laneMode === 'prep'
      ? progress.isPrepDone
      : laneMode === 'sideQuest'
      ? progress.isSideQuestDone
      : progress.isFullyDone;

  const handleAdvance = async () => {
    try {
      setLocalBusy(true);
      if (laneMode && onCompleteStation) {
        await onCompleteStation(ticket.id, laneMode);
      } else {
        await onAdvance(ticket.id, ticket.status);
      }
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

  const handleUnitToggle = (unitKey: string) => {
    const wasDone = isUnitDone(unitKey);
    toggleUnitDone(unitKey);

    // Si se está marcando como LISTO (no desmarcando) y hay más de 1 ítem:
    if (!wasDone && displayedUnits.length > 1) {
      const currentIndex = displayedUnits.findIndex((u) => u.unitKey === unitKey);

      // Buscar el siguiente ítem pendiente hacia adelante
      let nextUnit: KitchenProductionUnit | undefined;
      for (let i = currentIndex + 1; i < displayedUnits.length; i++) {
        if (!isUnitDone(displayedUnits[i].unitKey)) {
          nextUnit = displayedUnits[i];
          break;
        }
      }

      // Si no hay siguientes hacia adelante, buscar cualquier otro pendiente desde el inicio
      if (!nextUnit) {
        nextUnit = displayedUnits.find(
          (u) => u.unitKey !== unitKey && !isUnitDone(u.unitKey)
        );
      }

      if (nextUnit) {
        setExpandedUnitKey(nextUnit.unitKey);
      } else {
        // Al completar el último ítem pendiente, colapsar para despejar la vista
        setExpandedUnitKey(null);
      }
    }
  };

  const handleUnitHeaderClick = (unitKey: string) => {
    if (displayedUnits.length <= 1) return;
    setExpandedUnitKey((prev) => (prev === unitKey ? null : unitKey));
  };

  const locationDisplay = formatKitchenLocation(ticket.location);

  // Etiqueta clara del botón de despacho global
  const dispatchButtonLabel =
    laneMode === 'prep'
      ? 'Despachar Plancha'
      : laneMode === 'sideQuest'
      ? 'Despachar Side Quest'
      : 'Despachar Comanda';

  return (
    <div className="bg-surface-card rounded-3xl p-4 sm:p-5 border-2 border-line shadow-card flex flex-col justify-between transition-all hover:border-accent/40">
      {/* ─── Encabezado de Comanda KDS ────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div className="space-y-1">
            {/* Nombre del Cliente (Máxima Jerarquía Visual) */}
            <h3 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight leading-tight">
              {ticket.customerName}
            </h3>

            {/* Folio, Ubicación & Fecha Programada */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg bg-surface-raised border border-line text-text-secondary">
                #{ticket.folio}
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
          </div>

          {/* Badge de Progreso de Ítems */}
          <div className="px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-xs font-black text-text-primary shrink-0 select-none">
            {progress.completedUnits}/{progress.totalUnits} listos
          </div>
        </div>

        {/* Nota General del Pedido (Acordeón si es larga, oculta si no existe) */}
        <OrderNoteAccordion note={ticket.orderNote} />

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
              const isMultiItem = displayedUnits.length > 1;
              const isExpanded = !isMultiItem || expandedUnitKey === unit.unitKey;
              const customized = isUnitCustomized(unit);

              return (
                <div
                  key={unit.unitKey}
                  className={`rounded-2xl border-2 transition-all overflow-hidden ${
                    isDone
                      ? 'bg-emerald-500/5 border-emerald-500/30 opacity-80'
                      : isExpanded
                      ? 'bg-surface-raised border-accent/40 shadow-xs'
                      : 'bg-surface-raised border-line hover:border-accent/30'
                  }`}
                >
                  {/* Encabezado del Ítem: Número, Nombre y Micro-badge de combo */}
                  <div
                    role={isMultiItem ? 'button' : undefined}
                    tabIndex={isMultiItem ? 0 : undefined}
                    onClick={() => isMultiItem && handleUnitHeaderClick(unit.unitKey)}
                    onKeyDown={(e) => {
                      if (isMultiItem && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleUnitHeaderClick(unit.unitKey);
                      }
                    }}
                    aria-expanded={isMultiItem ? isExpanded : undefined}
                    aria-label={isMultiItem ? `${isExpanded ? 'Colapsar' : 'Desplegar'} ${unit.name}` : undefined}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-2.5 select-none ${
                      isMultiItem ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-surface-card border border-line text-[10px] font-black uppercase text-text-muted shrink-0">
                        Ítem #{unit.itemIndex}
                      </span>

                      {unit.isFromCombo ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider shrink-0">
                          combo
                        </span>
                      ) : null}

                      {/* Nombre del Producto */}
                      <span className="text-base sm:text-lg font-black text-text-primary leading-tight truncate">
                        {unit.itemKind === 'burger' && '🍔 '}
                        {unit.itemKind === 'garnish' && '🍟 '}
                        {unit.itemKind === 'drink' && '🥤 '}
                        {unit.itemKind === 'extra' && '🥫 '}
                        {unit.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Badge de Personalizada vs Receta Original (Visible SOLO cuando está colapsado en multi-ítem) */}
                      {isMultiItem && !isExpanded && !isDone && (
                        <>
                          {unit.itemKind === 'burger' ? (
                            customized ? (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] sm:text-[11px] font-black border border-amber-500/30 animate-in fade-in">
                                🛠️ Personalizada
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-[11px] font-black border border-emerald-500/30 animate-in fade-in">
                                ✓ Receta Original
                              </span>
                            )
                          ) : customized ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] sm:text-[11px] font-black border border-amber-500/30 animate-in fade-in">
                              🛠️ Personalizada
                            </span>
                          ) : null}
                        </>
                      )}

                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Listo</span>
                        </span>
                      ) : null}

                      {/* Icono de Toggle en multi-ítem */}
                      {isMultiItem && (
                        <div className="w-6 h-6 rounded-lg bg-surface-card border border-line flex items-center justify-center text-text-muted">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─── Cuerpo Desplegable del Ítem ─────────────────────────────────── */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 space-y-2.5 pt-0 border-t border-line/40 animate-in fade-in duration-200">
                      {/* ─── Unificación de Modificaciones (Remociones '-' y Extras '+') ───────── */}
                      {((unit.removedIngredients && unit.removedIngredients.length > 0) ||
                        (unit.extras && unit.extras.length > 0)) ? (
                        <div className="pt-2" role="list" aria-label="Modificaciones del producto">
                          <div className="flex flex-wrap gap-1.5">
                            {/* Remociones (-) */}
                            {unit.removedIngredients?.map((mod, mIdx) => (
                              <span
                                key={`rem-${mIdx}`}
                                role="listitem"
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 text-xs sm:text-sm font-black border border-red-500/30 tracking-tight"
                              >
                                {formatKitchenRemovalLabel(mod)}
                              </span>
                            ))}

                            {/* Extras (+) con cantidad explícita */}
                            {unit.extras?.map((extra, eIdx) => (
                              <span
                                key={`ext-${eIdx}`}
                                role="listitem"
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-black border border-emerald-500/30 tracking-tight"
                              >
                                {formatKitchenExtraLabel(extra)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* ✓ Receta Original si no tiene modificaciones */}
                      {unit.itemKind === 'burger' && !customized ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black mt-2">
                          <span>✓</span>
                          <span>Receta Original</span>
                        </div>
                      ) : null}

                      {/* Nota Fija en la Base del Ítem (Acordeón si es larga, oculta si no existe) */}
                      <ItemNoteAccordion note={unit.burgerNote} />

                      {/* Botón Individual del Ítem (1-Tap con touch target >= 44px) */}
                      <div className="pt-2 border-t border-line/60">
                        <button
                          type="button"
                          onClick={() => handleUnitToggle(unit.unitKey)}
                          className={`w-full min-h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                            isDone
                              ? 'bg-surface-card hover:bg-surface-raised border-2 border-line text-text-muted hover:text-text-primary active:scale-[0.98]'
                              : 'bg-surface-card hover:bg-emerald-500/15 border-2 border-line hover:border-emerald-500/40 text-text-primary active:scale-[0.98]'
                          }`}
                          aria-pressed={isDone}
                          aria-label={isDone ? `Desmarcar ${unit.name}` : `Marcar ${unit.name} como listo`}
                        >
                          {isDone ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
                              <span className="text-xs sm:text-sm">Desmarcar / Volver a pendiente</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Marcar Ítem Listo</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Botón Global de la Comanda (Despachar) con Bloqueo de Incompletos ──── */}
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
              disabled={localBusy || isUpdating || !isStationReady}
              onClick={handleAdvance}
              className={`flex-1 h-12 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isStationReady
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
                  <span>{dispatchButtonLabel}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              disabled={localBusy || isUpdating || !isStationReady}
              onClick={handleAdvance}
              className={`w-full h-12 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isStationReady
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
                  <span>{dispatchButtonLabel}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Indicador Informativo contextual */}
        {!isStationReady && (
          <div className="text-center text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
            {laneMode === 'prep' && (
              <span>Faltan hamburguesas por marcar en Plancha ({progress.prepCompleted}/{progress.prepTotal})</span>
            )}
            {laneMode === 'sideQuest' && (
              <span>Faltan complementos por marcar en Side Quest ({progress.sideCompleted}/{progress.sideTotal})</span>
            )}
            {!laneMode && (
              <span>Faltan ítems ({progress.completedUnits}/{progress.totalUnits})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
