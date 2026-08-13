import { useMemo, useRef, useEffect, useCallback } from "react";
import { Calendar, Filter, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { OrderV2DeliveryInfo } from "@config/index";
import { parseOrderCustomerDetails } from "../lib/order-parser";

export type CalendarDateOption = {
  key: string; // "today" | "all" | "past" | "YYYY-MM-DD"
  dateStr?: string; // "YYYY-MM-DD"
  dayName: string; // "Hoy", "Jue", "Vie", etc.
  dayNumber: string; // "5", "6", etc.
  monthName: string; // "Ago", etc.
  isWeekend: boolean;
  isToday: boolean;
  pendingCount: number;
  totalCount: number;
};

type HorizontalDateCalendarFilterProps = {
  orders: Array<{
    id: string;
    customer: string;
    note?: string;
    createdAt?: string;
    createdAtMs?: number;
    delivery?: OrderV2DeliveryInfo;
    status: string;
  }>;
  selectedDate: string; // "all" | "today" | "past" | "YYYY-MM-DD"
  onSelectDate: (dateKey: string) => void;
};

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function HorizontalDateCalendarFilter({
  orders,
  selectedDate,
  onSelectDate,
}: HorizontalDateCalendarFilterProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const calendarOptions = useMemo(() => {
    const today = new Date();
    const todayStr = formatIsoDate(today);

    const pendingByDate = new Map<string, number>();
    const totalByDate = new Map<string, number>();

    let totalPendingUpcoming = 0;
    let pastPendingCount = 0;
    let pastTotalCount = 0;

    orders.forEach((order) => {
      const isPending = order.status !== "delivered" && order.status !== "cancelled";
      const details = parseOrderCustomerDetails(order.customer, order.note, order.createdAt, order.delivery);
      let targetDateStr = todayStr;

      if (details.isScheduled && details.scheduledDeliveryDate) {
        targetDateStr = details.scheduledDeliveryDate;
      } else if (order.createdAtMs) {
        targetDateStr = formatIsoDate(new Date(order.createdAtMs));
      }

      if (targetDateStr < todayStr) {
        pastTotalCount++;
        if (isPending) pastPendingCount++;
      } else {
        // Solo pedidos de hoy y futuros cuentan en 'Todos'
        if (isPending) totalPendingUpcoming++;
        totalByDate.set(targetDateStr, (totalByDate.get(targetDateStr) || 0) + 1);
        if (isPending) {
          pendingByDate.set(targetDateStr, (pendingByDate.get(targetDateStr) || 0) + 1);
        }
      }
    });

    // Construir 14 días consecutivos desde hoy
    const dateStrSet = new Set<string>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dateStrSet.add(formatIsoDate(d));
    }

    // Incluir cualquier fecha futura que tenga pedidos programados más allá de 14 días
    totalByDate.forEach((_, dateStr) => {
      if (dateStr >= todayStr) {
        dateStrSet.add(dateStr);
      }
    });

    const sortedDates = Array.from(dateStrSet).sort();
    const dates: CalendarDateOption[] = [];

    sortedDates.forEach((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return;
      const current = new Date(year, month - 1, day);
      const isToday = dateStr === todayStr;
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayNameRaw = isToday
        ? "Hoy"
        : current.toLocaleDateString("es-MX", { weekday: "short" });
      const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1).replace(".", "");
      const dayNumber = String(current.getDate());
      const monthNameRaw = current.toLocaleDateString("es-MX", { month: "short" });
      const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1).replace(".", "");

      const pendingCount = pendingByDate.get(dateStr) || 0;
      const totalCount = totalByDate.get(dateStr) || 0;

      dates.push({
        key: isToday ? "today" : dateStr,
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
      totalPendingUpcoming,
      pastPendingCount,
      pastTotalCount,
    };
  }, [orders]);

  const isPastSelected = selectedDate === "past";

  const scrollRail = useCallback((direction: "left" | "right") => {
    if (!railRef.current) return;
    const scrollAmount = direction === "left" ? -240 : 240;
    railRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  // Auto-scroll hacia la fecha activa al montar o cambiar de selección
  useEffect(() => {
    if (!railRef.current) return;
    const activeEl = railRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedDate]);

  return (
    <div className="v3-calendar-filter-shell my-3 w-full max-w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="v3-calendar-header flex flex-wrap items-center justify-between gap-2 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--color-accent)]" />
          <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
            Fecha de Entrega
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Controles de desplazamiento para desktop / tablet */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollRail("left")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              aria-label="Desplazar calendario a la izquierda"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => scrollRail("right")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              aria-label="Desplazar calendario a la derecha"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Botón Ver Todos (Hoy y Futuros) */}
          <button
            type="button"
            className={`v3-calendar-pill-all px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
              selectedDate === "all"
                ? "bg-[var(--color-accent)] text-white shadow-sm ring-2 ring-[var(--color-accent)]/30 font-extrabold"
                : "bg-[var(--color-surface-raised)] border border-[var(--color-line)] text-[var(--color-text-secondary)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-text-primary)]"
            }`}
            onClick={() => onSelectDate("all")}
          >
            <Filter size={12} />
            <span>Ver Todos</span>
            {calendarOptions.totalPendingUpcoming > 0 ? (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedDate === "all"
                  ? "bg-black/20 text-white"
                  : "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              }`}>
                {calendarOptions.totalPendingUpcoming}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Riel Horizontal de Fechas */}
      <div
        ref={railRef}
        className="v3-calendar-rail flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none snap-x w-full max-w-full"
      >
        {/* Tarjeta Especial: Anteriores / Histórico */}
        <button
          type="button"
          data-active={isPastSelected}
          onClick={() => onSelectDate("past")}
          className={`v3-calendar-card flex-shrink-0 snap-start px-3.5 py-2.5 rounded-2xl transition-all border text-left min-w-[105px] min-h-[64px] flex flex-col justify-between relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
            isPastSelected
              ? "bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40 shadow-sm"
              : "bg-[var(--color-surface-raised)] border-amber-500/30 text-amber-800 dark:text-amber-300 hover:border-amber-500/60"
          }`}
        >
          <div className="flex items-center justify-between w-full gap-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600 dark:text-amber-400" />
              Anteriores
            </span>
            {calendarOptions.pastPendingCount > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-stone-900 animate-pulse">
                {calendarOptions.pastPendingCount}
              </span>
            ) : calendarOptions.pastTotalCount > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {calendarOptions.pastTotalCount}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">Histórico</span>
            <span className="text-[10px] text-amber-800/70 dark:text-amber-400/70">pasados</span>
          </div>
        </button>

        {/* Tarjetas de Días */}
        {calendarOptions.dates.map((item) => {
          const isSelected =
            selectedDate === item.key ||
            (selectedDate === "today" && item.isToday) ||
            (item.dateStr && selectedDate === item.dateStr);

          return (
            <button
              key={item.key}
              type="button"
              data-active={isSelected}
              onClick={() => onSelectDate(item.key)}
              className={`v3-calendar-card flex-shrink-0 snap-start px-3.5 py-2.5 rounded-2xl transition-all border text-left min-w-[90px] min-h-[64px] flex flex-col justify-between relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                isSelected
                  ? "bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 shadow-sm"
                  : item.isToday
                    ? "bg-[var(--color-surface)] border-[var(--color-accent)]/50 text-[var(--color-text-primary)] shadow-sm hover:border-[var(--color-accent)]"
                    : item.isWeekend
                      ? "bg-[var(--color-surface-raised)] border-[var(--color-line)] text-[var(--color-text-muted)] opacity-80 hover:opacity-100 hover:border-[var(--color-line-strong)]"
                      : "bg-[var(--color-surface-raised)] border-[var(--color-line)] text-[var(--color-text-primary)] hover:border-[var(--color-line-strong)]"
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span className={`text-[11px] font-black uppercase tracking-wider ${
                  isSelected
                    ? "text-[var(--color-accent)] font-black"
                    : item.isToday
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)]"
                }`}>
                  {item.dayName}
                </span>

                <div className="flex items-center gap-1">
                  {item.isToday && !isSelected ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-[var(--color-accent)] text-white shadow-xs">
                      HOY
                    </span>
                  ) : null}
                  {item.pendingCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-[var(--color-accent)] text-white shadow-xs animate-pulse">
                      {item.pendingCount}
                    </span>
                  ) : item.totalCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {item.totalCount}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-1 flex items-baseline justify-between w-full">
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black tracking-tight ${
                    isSelected
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-primary)]"
                  }`}>
                    {item.dayNumber}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                    {item.monthName}
                  </span>
                </div>
                {item.isWeekend ? (
                  <span className="text-[9px] font-semibold text-[var(--color-text-muted)] uppercase tracking-tighter">
                    Fin
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
