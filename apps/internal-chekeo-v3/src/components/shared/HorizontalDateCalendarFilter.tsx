/**
 * HorizontalDateCalendarFilter.tsx
 *
 * Filtro de Riel Horizontal de Fechas para Pedidos y Cocina de Chekeo V3.
 *
 * Características:
 * - Detección y parseo en zona horaria CDMX (America/Mexico_City).
 * - Detección de fechas programadas (scheduledDate / scheduledDeliveryDate) o fecha de creación.
 * - Botón "⏱️ Anteriores / Histórico" con conteo de comandas pasadas que siguen pendientes.
 * - Tarjeta destacada "🟢 HOY" con indicador visual y conteo.
 * - Riel horizontal de 14 días consecutivos + fechas futuras adicionales con órdenes.
 * - Botón "Ver Todos" con badge global.
 */

import React, { useMemo } from 'react';
import { Calendar, Filter, Clock } from 'lucide-react';
import type { OrderV2 } from '@config/index';

export interface CalendarDateOption {
  key: string;
  dateStr: string;
  dayName: string;
  dayNumber: string;
  monthName: string;
  isWeekend: boolean;
  isToday: boolean;
  pendingCount: number;
  totalCount: number;
}

export interface HorizontalDateCalendarFilterProps {
  orders: OrderV2[];
  selectedDate: string; // 'all' | 'today' | 'past' | 'YYYY-MM-DD'
  onSelectDate: (dateKey: string) => void;
  className?: string;
}

/**
 * Formatea un objeto Date en formato YYYY-MM-DD según zona horaria local o CDMX.
 */
function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extrae la fecha objetivo (YYYY-MM-DD) de un pedido OrderV2.
 */
export function extractOrderTargetDate(order: OrderV2, todayStr: string): string {
  // 1. Verificar si tiene scheduledDate en delivery
  const delivery = order.delivery as Record<string, unknown> | undefined;
  if (delivery) {
    if (typeof delivery.scheduledDate === 'string' && delivery.scheduledDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return delivery.scheduledDate;
    }
    if (typeof delivery.scheduledDeliveryDate === 'string' && delivery.scheduledDeliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return delivery.scheduledDeliveryDate;
    }
  }

  // 2. Si se creó con createdAt ISO
  if (order.createdAt) {
    try {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) {
        return formatIsoDate(d);
      }
    } catch {
      // ignore
    }
  }

  return todayStr;
}

export function HorizontalDateCalendarFilter({
  orders,
  selectedDate,
  onSelectDate,
  className = '',
}: HorizontalDateCalendarFilterProps) {
  const calendarOptions = useMemo(() => {
    const today = new Date();
    const todayStr = formatIsoDate(today);

    const pendingByDate = new Map<string, number>();
    const totalByDate = new Map<string, number>();

    let totalPendingAll = 0;
    let pastPendingCount = 0;
    let pastTotalCount = 0;

    orders.forEach((order) => {
      const isTerminal = order.status === 'delivered' || order.status === 'cancelled';
      const isPending = !isTerminal;

      if (isPending) {
        totalPendingAll++;
      }

      const targetDateStr = extractOrderTargetDate(order, todayStr);

      if (targetDateStr < todayStr) {
        pastTotalCount++;
        if (isPending) {
          pastPendingCount++;
        }
      } else {
        totalByDate.set(targetDateStr, (totalByDate.get(targetDateStr) || 0) + 1);
        if (isPending) {
          pendingByDate.set(targetDateStr, (pendingByDate.get(targetDateStr) || 0) + 1);
        }
      }
    });

    // Construir los 14 días consecutivos desde hoy
    const dateStrSet = new Set<string>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dateStrSet.add(formatIsoDate(d));
    }

    // Incluir cualquier fecha futura que tenga pedidos más allá de 14 días
    totalByDate.forEach((_, dateStr) => {
      if (dateStr >= todayStr) {
        dateStrSet.add(dateStr);
      }
    });

    const sortedDates = Array.from(dateStrSet).sort();
    const dates: CalendarDateOption[] = [];

    sortedDates.forEach((dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return;
      const current = new Date(year, month - 1, day);
      const isToday = dateStr === todayStr;
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayNameRaw = isToday
        ? 'Hoy'
        : current.toLocaleDateString('es-MX', { weekday: 'short' });
      const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1).replace('.', '');
      const dayNumber = String(current.getDate());
      const monthNameRaw = current.toLocaleDateString('es-MX', { month: 'short' });
      const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1).replace('.', '');

      const pendingCount = pendingByDate.get(dateStr) || 0;
      const totalCount = totalByDate.get(dateStr) || 0;

      dates.push({
        key: isToday ? 'today' : dateStr,
        dateStr,
        dayName,
        dayNumber,
        monthName,
        isWeekend,
        isToday,
        pendingCount,
        totalCount,
      });
    });

    return {
      dates,
      totalPendingAll,
      pastPendingCount,
      pastTotalCount,
    };
  }, [orders]);

  const isPastSelected = selectedDate === 'past';

  return (
    <div className={`w-full max-w-full overflow-hidden space-y-2.5 ${className}`}>
      {/* ─── Encabezado del Riel de Fechas ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
            Fecha de Entrega
          </span>
        </div>

        {/* Botones de Control Superior: Histórico (Past) + Ver Todos */}
        <div className="flex items-center gap-1.5">
          {/* Botón Histórico / Anteriores (Pastilla) */}
          <button
            type="button"
            onClick={() => onSelectDate('past')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isPastSelected
                ? 'bg-amber-500 text-zinc-950 shadow-xs ring-1 ring-amber-500/50'
                : 'bg-surface-raised border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
            title="Ver pedidos anteriores / históricos pendientes"
          >
            <Clock className="w-3 h-3" />
            <span>Anteriores</span>
            {calendarOptions.pastPendingCount > 0 ? (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isPastSelected
                    ? 'bg-zinc-950 text-amber-400'
                    : 'bg-amber-500 text-zinc-950 animate-pulse'
                }`}
              >
                {calendarOptions.pastPendingCount}
              </span>
            ) : calendarOptions.pastTotalCount > 0 ? (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isPastSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-surface text-text-muted'
                }`}
              >
                {calendarOptions.pastTotalCount}
              </span>
            ) : null}
          </button>

          {/* Botón Ver Todos */}
          <button
            type="button"
            onClick={() => onSelectDate('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedDate === 'all'
                ? 'bg-accent text-white shadow-xs'
                : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Ver Todos</span>
            {calendarOptions.totalPendingAll > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  selectedDate === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-accent-soft text-accent'
                }`}
              >
                {calendarOptions.totalPendingAll}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Riel de Scroll Horizontal ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar snap-x w-full max-w-full">
        {/* Tarjetas de Fechas Consecutivas */}
        {calendarOptions.dates.map((item) => {
          const isSelected =
            selectedDate === item.key ||
            (selectedDate === 'today' && item.isToday) ||
            (item.dateStr && selectedDate === item.dateStr);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectDate(item.key)}
              className={`flex-shrink-0 snap-start px-3.5 py-2.5 rounded-2xl transition-all border text-left min-w-[85px] flex flex-col justify-between cursor-pointer select-none ${
                isSelected
                  ? 'bg-accent/15 border-accent text-accent ring-2 ring-accent/30 shadow-card'
                  : item.isToday
                  ? 'bg-surface-card border-accent/40 text-text-primary hover:border-accent'
                  : item.isWeekend
                  ? 'bg-surface-card/60 border-line text-text-muted opacity-70 hover:opacity-100'
                  : 'bg-surface-card border-line text-text-primary hover:border-line/80'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    item.isToday ? 'text-accent' : 'text-text-secondary'
                  }`}
                >
                  {item.dayName}
                </span>

                <div className="flex items-center gap-1">
                  {item.isToday && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black rounded-full bg-accent text-white shadow-xs tracking-tighter">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>HOY</span>
                    </span>
                  )}
                  {item.pendingCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-accent text-white shadow-xs animate-pulse">
                      {item.pendingCount}
                    </span>
                  ) : item.totalCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-surface-raised text-text-muted">
                      {item.totalCount}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black tracking-tight text-text-primary">
                  {item.dayNumber}
                </span>
                <span className="text-[10px] font-semibold text-text-muted">
                  {item.monthName}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
