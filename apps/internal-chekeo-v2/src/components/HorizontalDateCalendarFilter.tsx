import { useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { parseOrderCustomerDetails } from "../lib/order-parser";

export type CalendarDateOption = {
  key: string; // "today" | "all" | "YYYY-MM-DD"
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
    status: string;
  }>;
  selectedDate: string; // "all" | "today" | "YYYY-MM-DD"
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
  const calendarOptions = useMemo(() => {
    const today = new Date();
    const todayStr = formatIsoDate(today);

    // Map order pending counts per date (YYYY-MM-DD or 'today')
    const pendingByDate = new Map<string, number>();
    const totalByDate = new Map<string, number>();

    let totalPendingAll = 0;

    orders.forEach((order) => {
      const isPending = order.status !== "delivered" && order.status !== "cancelled";
      if (isPending) totalPendingAll++;

      const details = parseOrderCustomerDetails(order.customer, order.note, order.createdAt);
      let targetDateStr = todayStr;

      if (details.isScheduled && details.scheduledDeliveryDate) {
        targetDateStr = details.scheduledDeliveryDate;
      } else if (order.createdAtMs) {
        targetDateStr = formatIsoDate(new Date(order.createdAtMs));
      }

      totalByDate.set(targetDateStr, (totalByDate.get(targetDateStr) || 0) + 1);
      if (isPending) {
        pendingByDate.set(targetDateStr, (pendingByDate.get(targetDateStr) || 0) + 1);
      }
    });

    const dates: CalendarDateOption[] = [];

    // Compile dynamic date list ONLY from dates that have registered orders
    const dateKeys = Array.from(totalByDate.keys()).sort();

    dateKeys.forEach((dateStr) => {
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

    return { dates, totalPendingAll };
  }, [orders]);

  return (
    <div className="v3-calendar-filter-shell my-3 w-full max-w-full overflow-hidden">
      <div className="v3-calendar-header flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-emerald-500" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Filtro de Fecha de Entrega
          </span>
        </div>
        <button
          type="button"
          className={`v3-calendar-pill-all px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
            selectedDate === "all"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
              : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
          }`}
          onClick={() => onSelectDate("all")}
        >
          <Filter size={12} />
          <span>Ver Todos</span>
          {calendarOptions.totalPendingAll > 0 ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-900 text-[10px] text-emerald-400 font-extrabold">
              {calendarOptions.totalPendingAll}
            </span>
          ) : null}
        </button>
      </div>

      {/* Horizontal Scroll Rail */}
      <div className="v3-calendar-rail flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x w-full max-w-full">
        {calendarOptions.dates.map((item) => {
          const isSelected =
            selectedDate === item.key ||
            (selectedDate === "today" && item.isToday) ||
            (item.dateStr && selectedDate === item.dateStr);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectDate(item.key)}
              className={`v3-calendar-card flex-shrink-0 snap-start px-3.5 py-2.5 rounded-2xl transition-all border text-left min-w-[82px] flex flex-col justify-between relative ${
                isSelected
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30"
                  : item.isToday
                    ? "bg-zinc-900/90 border-emerald-500/40 text-zinc-200 hover:border-emerald-500/70"
                    : item.isWeekend
                      ? "bg-zinc-950/60 border-zinc-800/60 text-zinc-500 opacity-60"
                      : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span className={`text-[11px] font-black uppercase tracking-wider ${item.isToday ? "text-emerald-400" : "text-zinc-400"}`}>
                  {item.dayName}
                </span>
                {item.pendingCount > 0 ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-zinc-950 shadow-sm animate-pulse">
                    {item.pendingCount}
                  </span>
                ) : item.totalCount > 0 ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-800 text-zinc-400">
                    {item.totalCount}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black tracking-tight">{item.dayNumber}</span>
                <span className="text-[10px] font-semibold text-zinc-400">{item.monthName}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
