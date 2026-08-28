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
import { extractOrderTargetDate } from '../shared/HorizontalDateCalendarFilter';
import type { OrderV2 } from '@config/index';

import { getCdmxTodayString } from '@config/index';

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
      const todayStr = getCdmxTodayString();
      const targetDate = extractOrderTargetDate(
        {
          ...ticket,
          delivery: {
            scheduledDate: ticket.scheduledDate,
            isScheduled: ticket.isScheduled,
          },
          createdAt: ticket.createdAtIso,
        } as unknown as OrderV2,
        todayStr
      );

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

    // 2. Filtro de carril operativo estricto por unidades de producción reales
    if (laneMode === 'prep') {
      return (ticket.productionUnits || []).some((u) => u.station === 'prep');
    }
    if (laneMode === 'sideQuest') {
      return (ticket.productionUnits || []).some((u) => u.station === 'sideQuest');
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
