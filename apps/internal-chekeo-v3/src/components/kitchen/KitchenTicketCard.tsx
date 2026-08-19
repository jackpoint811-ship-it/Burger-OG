/**
 * KitchenTicketCard.tsx — PR-V3-10
 *
 * Comanda de cocina de alto contraste legible a distancia para tablets y pantallas KDS:
 * - Folio grande e indicador de tiempo transcurrido con semáforo de alerta
 * - Remociones resaltadas en rojo (🔴 SIN ...)
 * - Extras resaltados en verde (🟢 +EXTRA ...)
 * - Guarnición específica de combo y bebida destacadas
 * - Botón de 1-clic para avanzar de estación
 */

import React, { useState } from 'react';
import {
  Clock,
  Flame,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  MapPin,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import {
  formatElapsedTime,
  type KitchenTicket,
  type KitchenTicketItem,
} from '../../features/kitchen/types/kitchen.types';

export interface KitchenTicketCardProps {
  ticket: KitchenTicket;
  onAdvance: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  onRevert?: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  isUpdating?: boolean;
}

export function KitchenTicketCard({
  ticket,
  onAdvance,
  onRevert,
  isUpdating = false,
}: KitchenTicketCardProps) {
  const [localBusy, setLocalBusy] = useState(false);

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

  // Semáforo de tiempos
  const isUrgent = ticket.alertTone === 'urgent';
  const isWarning = ticket.alertTone === 'warning';

  // Configuración visual por etapa
  let actionLabel = 'Mandar a Plancha';
  let actionIcon = <Flame className="w-5 h-5 text-white" />;
  let actionBtnClass = 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-[0.98]';

  if (ticket.status === 'preparing') {
    actionLabel = 'Marcar Listo';
    actionIcon = <CheckCircle2 className="w-5 h-5 text-white" />;
    actionBtnClass = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.98]';
  } else if (ticket.status === 'ready') {
    actionLabel = 'Despachar / Entregar';
    actionIcon = <PackageCheck className="w-5 h-5 text-white" />;
    actionBtnClass = 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-[0.98]';
  }

  // Estilos de borde y cabecera según urgencia
  const borderToneClass = isUrgent
    ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-2 ring-red-500/30'
    : isWarning
    ? 'border-amber-500/70 shadow-card'
    : 'border-line shadow-card';

  return (
    <div
      className={`bg-surface-card rounded-3xl p-4 sm:p-5 border-2 flex flex-col justify-between transition-all ${borderToneClass}`}
    >
      {/* ─── Encabezado de Comanda KDS ────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
          <div>
            {/* Folio Grande */}
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
                {ticket.folio}
              </span>
              {ticket.mode === 'pickup' ? (
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 font-extrabold text-[11px] uppercase tracking-wider">
                  Pickup
                </span>
              ) : null}
            </div>

            {/* Cliente y Destino */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary mt-0.5">
              <span className="text-text-primary font-extrabold truncate max-w-[140px] sm:max-w-[180px]">
                {ticket.customerName}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 truncate max-w-[120px] text-text-muted">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{ticket.location}</span>
              </span>
            </div>
          </div>

          {/* Temporizador de Tiempo Transcurrido */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-mono font-black text-sm sm:text-base shrink-0 ${
              isUrgent
                ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatElapsedTime(ticket.elapsedMinutes)}</span>
          </div>
        </div>

        {/* Nota General de la Orden si existe */}
        {ticket.orderNote ? (
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-start gap-1.5">
            <FileText className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="break-words">
              <span className="font-extrabold uppercase tracking-wide mr-1">Nota pedido:</span>
              <span>{ticket.orderNote}</span>
            </div>
          </div>
        ) : null}

        {/* ─── Lista de Ítems / Productos con Mods Destacados ───────────────────── */}
        <div className="space-y-3">
          {ticket.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 sm:p-3.5 rounded-2xl bg-surface-raised border border-line space-y-2"
            >
              {/* Título de producto con Cantidad */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-text-primary text-surface-card flex items-center justify-center font-black text-sm shrink-0">
                    {item.qty}x
                  </span>
                  <span className="font-black text-text-primary text-base sm:text-lg leading-tight">
                    {item.name}
                  </span>
                </div>

                {item.itemKind === 'combo' ? (
                  <span className="px-2 py-0.5 rounded-lg bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider">
                    Combo
                  </span>
                ) : null}
              </div>

              {/* 🔴 Remociones / Ingredientes Removidos (Crítico para Cocina) */}
              {item.removedIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.removedIngredients.map((mod, mIdx) => (
                    <span
                      key={mIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600 text-white text-xs font-black tracking-wide shadow-xs"
                    >
                      <span>🔴</span>
                      <span>SIN {mod.toUpperCase()}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              {/* 🟢 Extras Añadidos (Crítico para Cocina) */}
              {item.extras.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.extras.map((extra, eIdx) => (
                    <span
                      key={eIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black tracking-wide shadow-xs"
                    >
                      <span>🟢</span>
                      <span>+{extra.name.toUpperCase()}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              {/* 🍟 Guarnición Específica de Combo */}
              {item.garnish ? (
                <div className="pt-1.5 border-t border-line/60 flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <span className="text-sm">🍟</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    Guarnición:
                  </span>
                  <span>{item.garnish.name}</span>
                </div>
              ) : null}

              {/* 🥤 Bebida Incluida */}
              {item.includedDrink ? (
                <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                  <span className="text-sm">🥤</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    Bebida:
                  </span>
                  <span>{item.includedDrink.name}</span>
                </div>
              ) : null}

              {/* Desglose de Burgers de Combo si existen personalizaciones por separado */}
              {item.comboBurgers && item.comboBurgers.length > 0 ? (
                <div className="mt-2 pt-2 border-t border-line/70 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                    Burgers del Combo:
                  </span>
                  {item.comboBurgers.map((cb, cbIdx) => (
                    <div
                      key={cbIdx}
                      className="p-2 rounded-xl bg-surface-card border border-line text-xs space-y-1.5"
                    >
                      <span className="font-black text-text-primary">🍔 {cb.name}</span>
                      {cb.removedIngredients.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cb.removedIngredients.map((mod, cmIdx) => (
                            <span
                              key={cmIdx}
                              className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-black"
                            >
                              🔴 SIN {mod.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {cb.extras.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cb.extras.map((extra, ceIdx) => (
                            <span
                              key={ceIdx}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black"
                            >
                              🟢 +{extra.name.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {cb.burgerNote ? (
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 italic">
                          Nota: {cb.burgerNote}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Nota de la Hamburguesa individual */}
              {item.burgerNote ? (
                <div className="pt-1.5 border-t border-line/60 text-xs font-bold text-amber-600 dark:text-amber-400 italic">
                  <span>Nota: {item.burgerNote}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Botón de 1-Clic para Avanzar Estación ─────────────────────────────── */}
      <div className="pt-4 border-t border-line mt-4 flex items-center gap-2">
        {ticket.status !== 'new' && onRevert ? (
          <Button
            variant="outline"
            size="sm"
            disabled={localBusy || isUpdating}
            onClick={handleRevert}
            className="h-12 w-12 rounded-2xl shrink-0 p-0 border-line text-text-muted hover:text-text-primary"
            title="Retroceder comanda"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        ) : null}

        <button
          type="button"
          disabled={localBusy || isUpdating}
          onClick={handleAdvance}
          className={`flex-1 h-12 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${actionBtnClass}`}
        >
          {localBusy || isUpdating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Actualizando…</span>
            </>
          ) : (
            <>
              {actionIcon}
              <span>{actionLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
