/**
 * KitchenDisplay.tsx — PR-V3-10 / Refinamiento Operativo V3 (Paso 1)
 *
 * Contenedor directo de estación de cocina (Preparación / Side Quest):
 * - Consume `useKitchenDisplay` para sincronización en tiempo real
 * - Filtra las comandas por fecha seleccionada y carril operativo
 * - Renderiza directamente KitchenActiveStation sin encabezados ni barras intermedias
 */

import React from 'react';
import { KitchenActiveStation } from './KitchenActiveStation';
import { useKitchenDisplay } from '../../features/kitchen';

export interface KitchenDisplayProps {
  laneMode?: 'prep' | 'sideQuest';
  selectedDate?: string;
}

export function KitchenDisplay({
  laneMode = 'prep',
  selectedDate = 'today',
}: KitchenDisplayProps) {
  const {
    tickets,
    isLoading,
    advanceTicketStatus,
    revertTicketStatus,
    isUpdating,
  } = useKitchenDisplay({ autoRefresh: true, refetchIntervalMs: 10000 });

  // Filtrar comandas por fecha seleccionada y por carril operativo
  const filteredTickets = tickets.filter((ticket) => {
    // 1. Filtro de fecha
    if (selectedDate !== 'all') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const targetDate = ticket.scheduledDate || todayStr;

      if (selectedDate === 'today' && targetDate !== todayStr) {
        return false;
      }
      if (selectedDate === 'past' && targetDate >= todayStr) {
        return false;
      }
      if (selectedDate !== 'today' && selectedDate !== 'past' && targetDate !== selectedDate) {
        return false;
      }
    }

    // 2. Filtro de carril operativo
    if (laneMode === 'prep') {
      return ticket.totalBurgersCount > 0;
    }
    if (laneMode === 'sideQuest') {
      return (
        ticket.totalGarnishesCount > 0 ||
        ticket.totalDrinksCount > 0 ||
        ticket.totalExtrasCount > 0
      );
    }

    return true;
  });

  return (
    <div className="animate-in fade-in duration-300">
      <KitchenActiveStation
        laneMode={laneMode}
        tickets={filteredTickets}
        isLoading={isLoading}
        advanceTicketStatus={advanceTicketStatus}
        revertTicketStatus={revertTicketStatus}
        isUpdating={isUpdating}
      />
    </div>
  );
}
