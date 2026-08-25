/**
 * KitchenActiveStation.tsx — Chekeo V3
 *
 * Vista enfocada de estación de Cocina (Preparación / Side Quest):
 * - Comanda Activa en Foco: Nombre grande, folio, torre, nota del pedido desplegable e ítems desglosados con modificadores.
 * - Botón de acción táctil de alta visibilidad (✔ Hecha / Marcar Listo).
 * - Cola interactiva de comandas en espera.
 * - Acordeón colapsable de comandas listas con función de reversión rápida.
 */

import React, { useState, useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Inbox,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import type { KitchenTicket, KitchenTicketItem } from '../../features/kitchen/types/kitchen.types';

export interface KitchenActiveStationProps {
  laneMode: 'prep' | 'sideQuest';
  tickets: KitchenTicket[];
  isLoading: boolean;
  advanceTicketStatus: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  revertTicketStatus: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  isUpdating?: boolean;
}

export function KitchenActiveStation({
  laneMode,
  tickets,
  isLoading,
  advanceTicketStatus,
  revertTicketStatus,
  isUpdating = false,
}: KitchenActiveStationProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState<boolean>(true);
  const [isReadySectionOpen, setIsReadySectionOpen] = useState<boolean>(false);
  const [localBusyId, setLocalBusyId] = useState<string | null>(null);

  // Filtrar tickets correspondientes a esta estación
  const stationTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (laneMode === 'prep') {
        return t.totalBurgersCount > 0;
      }
      return t.totalGarnishesCount > 0 || t.totalDrinksCount > 0 || t.totalExtrasCount > 0;
    });
  }, [tickets, laneMode]);

  // Separar pendientes vs listos
  const pendingTickets = useMemo(
    () => stationTickets.filter((t) => t.status === 'new' || t.status === 'preparing'),
    [stationTickets]
  );

  const readyTickets = useMemo(
    () => stationTickets.filter((t) => t.status === 'ready'),
    [stationTickets]
  );

  // Ticket activo en foco
  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      const found = pendingTickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return pendingTickets[0] || null;
  }, [pendingTickets, selectedTicketId]);

  // Ítems a mostrar del ticket activo filtrados por la estación
  const displayedItems = useMemo(() => {
    if (!activeTicket) return [];
    return activeTicket.items.filter((item) => {
      if (laneMode === 'prep') {
        return item.itemKind === 'burger' || item.itemKind === 'combo';
      }
      return (
        item.itemKind === 'garnish' ||
        item.itemKind === 'drink' ||
        item.itemKind === 'extra' ||
        (item.itemKind === 'combo' && (item.garnish || item.includedDrink))
      );
    });
  }, [activeTicket, laneMode]);

  // Manejador de avance de estado de la comanda activa
  const handleAdvanceActive = async () => {
    if (!activeTicket) return;
    try {
      setLocalBusyId(activeTicket.id);
      await advanceTicketStatus(activeTicket.id, activeTicket.status);
      setSelectedTicketId(null);
    } finally {
      setLocalBusyId(null);
    }
  };

  // Manejador de reversión de una comanda lista
  const handleRevertTicket = async (ticketId: string, currentStatus: KitchenTicket['status']) => {
    try {
      setLocalBusyId(ticketId);
      await revertTicketStatus(ticketId, currentStatus);
    } finally {
      setLocalBusyId(null);
    }
  };

  // Configuración de textos por estación
  const stationHeader =
    laneMode === 'prep'
      ? {
          title: 'PREPARACIÓN',
          desc: 'Hamburguesas individuales y burgers dentro de combos.',
          countBadge: `${pendingTickets.length} pendiente${pendingTickets.length !== 1 ? 's' : ''}`,
          itemTypeBadge: (count: number) => `🍔 ${count} Burger${count !== 1 ? 's' : ''}`,
        }
      : {
          title: 'SIDE QUEST',
          desc: 'Papas, guarniciones, bebidas y extras no-burger.',
          countBadge: `${pendingTickets.length} pendiente${pendingTickets.length !== 1 ? 's' : ''}`,
          itemTypeBadge: (count: number) => `🍟 ${count} Side${count !== 1 ? 's' : ''}`,
        };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-surface-card rounded-3xl border border-line" />
        <div className="h-64 bg-surface-card rounded-3xl border border-line" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ─── Comanda Activa en Foco (PEDIDO ACTIVO) ─────────────────────────────── */}
      {activeTicket ? (
        <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border-2 border-accent/40 shadow-floating space-y-5">
          {/* Header del Pedido Activo */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider rounded-md bg-accent text-white shadow-xs">
                  PEDIDO ACTIVO
                </span>
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-surface-raised border border-line text-text-secondary">
                  {stationHeader.itemTypeBadge(
                    laneMode === 'prep'
                      ? activeTicket.totalBurgersCount
                      : activeTicket.totalGarnishesCount + activeTicket.totalDrinksCount
                  )}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {activeTicket.customerName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-text-muted">
                <span>#{activeTicket.folio}</span>
                {activeTicket.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-raised border border-line text-text-secondary">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>{activeTicket.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Badge de Estado Actual */}
            <Badge
              variant={activeTicket.status === 'preparing' ? 'warning' : 'default'}
              className="text-xs px-3 py-1 font-black"
            >
              {activeTicket.status === 'preparing' ? 'EN PLANCHA' : 'NUEVA'}
            </Badge>
          </div>

          {/* Nota del Pedido Desplegable */}
          {activeTicket.orderNote && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <button
                type="button"
                onClick={() => setIsNoteExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between font-black uppercase tracking-wide text-[11px] text-amber-800 dark:text-amber-300 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>📝 NOTA DEL PEDIDO</span>
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  <span>{isNoteExpanded ? 'Ocultar' : 'Desplegar'}</span>
                  {isNoteExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {isNoteExpanded && (
                <p className="mt-2 text-xs font-semibold leading-relaxed">
                  {activeTicket.orderNote}
                </p>
              )}
            </div>
          )}

          {/* Lista de Ítems Individuales de la Comanda */}
          <div className="space-y-3">
            {displayedItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                      {item.itemKind === 'combo'
                        ? 'COMBO'
                        : item.itemKind === 'burger'
                        ? 'BURGER'
                        : 'SIDE QUEST'}
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-text-primary">
                      {item.qty > 1 ? `${item.qty}x ` : ''}
                      {item.name}
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-black">
                    POR HACER
                  </Badge>
                </div>

                {/* Subtags: Combo, Remociones, Extras y Notas */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {item.garnish && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                      🍟 {item.garnish.name}
                    </span>
                  )}

                  {item.includedDrink && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                      🥤 {item.includedDrink.name}
                    </span>
                  )}

                  {item.removedIngredients && item.removedIngredients.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-extrabold text-[11px]">
                      🔴 SIN {item.removedIngredients.join(', ')}
                    </span>
                  )}

                  {item.extras && item.extras.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
                      🟢 +EXTRA {item.extras.map((e) => e.name).join(', ')}
                    </span>
                  )}

                  {item.burgerNote && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                      💬 {item.burgerNote}
                    </span>
                  )}
                </div>

                {/* Desglose de burgers dentro del combo si aplica */}
                {item.comboBurgers && item.comboBurgers.length > 0 && (
                  <div className="pt-2 border-t border-line/60 space-y-1.5 pl-2">
                    {item.comboBurgers.map((cb, cbIdx) => (
                      <div key={cbIdx} className="text-xs space-y-0.5">
                        <span className="font-bold text-text-primary">🍔 {cb.name}</span>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {cb.removedIngredients && cb.removedIngredients.length > 0 && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              🔴 SIN {cb.removedIngredients.join(', ')}
                            </span>
                          )}
                          {cb.extras && cb.extras.length > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              🟢 +EXTRA {cb.extras.map((e) => e.name).join(', ')}
                            </span>
                          )}
                          {cb.burgerNote && (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              💬 {cb.burgerNote}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón Principal de Acción Táctil (✔ Hecha / Marcar Lista) */}
          <div className="pt-2">
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={handleAdvanceActive}
              disabled={isUpdating || localBusyId === activeTicket.id}
              className="w-full py-4 text-sm sm:text-base font-black rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-[0.98] min-h-[52px] bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {localBusyId === activeTicket.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <span>✔ Hecha (Marcar Lista para Empaque)</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-surface-card border-2 border-dashed border-line text-center flex flex-col items-center justify-center gap-2 text-text-muted">
          <Inbox className="w-10 h-10 stroke-1 opacity-70" />
          <p className="text-base font-bold text-text-primary">Estación al día</p>
          <p className="text-xs text-text-secondary">
            No hay pedidos pendientes en cola de {laneMode === 'prep' ? 'plancha' : 'side quest'}.
          </p>
        </div>
      )}

      {/* ─── Cola de Pedidos en Espera (COLA DE PEDIDOS) ────────────────────────── */}
      {pendingTickets.length > 1 && (
        <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <span>COLA DE PEDIDOS</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-line text-[11px] text-text-primary">
              {pendingTickets.length - 1}
            </span>
          </h3>

          <div className="space-y-2">
            {pendingTickets
              .filter((t) => t.id !== activeTicket?.id)
              .map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-accent/40 hover:bg-surface transition-all text-left cursor-pointer group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-text-primary group-hover:text-accent transition-colors">
                        #{ticket.folio}
                      </span>
                      <span className="font-bold text-xs text-text-secondary truncate">
                        {ticket.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {ticket.items.map((i) => `${i.qty}x ${i.name}`).join(' · ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {ticket.status === 'preparing' ? 'En Plancha' : 'En Cola'}
                    </Badge>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ─── Acordeón de Pedidos Listos (LISTAS · X PEDIDOS) ───────────────────── */}
      {readyTickets.length > 0 && (
        <div className="bg-surface-card rounded-3xl border border-line shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setIsReadySectionOpen((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-surface-raised transition-colors"
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                LISTAS · {readyTickets.length} PEDIDO{readyTickets.length !== 1 ? 'S' : ''}
              </span>
              <p className="text-[11px] text-text-muted font-semibold mt-0.5">
                Toca para revisar o revertir
              </p>
            </div>
            {isReadySectionOpen ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>

          {isReadySectionOpen && (
            <div className="p-4 pt-0 border-t border-line space-y-2.5">
              {readyTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-line"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-text-primary">
                        #{ticket.folio}
                      </span>
                      <span className="font-bold text-xs text-text-secondary truncate">
                        {ticket.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {ticket.items.map((i) => `${i.qty}x ${i.name}`).join(' · ')}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevertTicket(ticket.id, ticket.status)}
                    disabled={isUpdating || localBusyId === ticket.id}
                    className="shrink-0 text-xs font-bold rounded-xl border-line text-text-secondary hover:text-text-primary"
                    title="Revertir comanda a preparación"
                  >
                    {localBusyId === ticket.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>Revertir</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
