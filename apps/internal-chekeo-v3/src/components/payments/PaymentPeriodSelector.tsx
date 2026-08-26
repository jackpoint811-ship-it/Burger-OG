/**
 * PaymentPeriodSelector.tsx — Chekeo V3 Pagos Refinement (UX Polish)
 *
 * Selector de Período y Calendario Financiero especializado para Arqueo y Conciliación:
 * - Nivel 1: Accesos rápidos de 1-toque: [ ⚡ Hoy ], [ ⏱️ Ayer ], [ 📅 Esta Semana ], [ 🌐 Todo ].
 * - Nivel 2: Selector interactivo de Fecha Específica con Mini Calendario Mensual Popover.
 * - Mini Calendario: Navegación de mes, días de la semana, indicadores de cobros por día, resalte de Hoy y seleccionado.
 * - Resumen Financiero del Período en vivo: Monto total, órdenes registradas y alerta de cobros por confirmar.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Zap,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import type { OrderV2 } from '@config/index';
import { getCdmxTodayString } from '@config/index';
import { formatCurrency } from '../../features/orders';
import {
  getCdmxYesterdayString,
  getCdmxPastDaysString,
  formatCdmxFriendlyDate,
} from '../../features/payments';
import { extractOrderTargetDate } from '../shared/HorizontalDateCalendarFilter';

export interface PaymentPeriodSelectorProps {
  orders: OrderV2[];
  selectedDate: string; // 'today' | 'yesterday' | 'week' | 'all' | 'YYYY-MM-DD'
  onSelectDate: (dateKey: string) => void;
  className?: string;
}

export function PaymentPeriodSelector({
  orders,
  selectedDate,
  onSelectDate,
  className = '',
}: PaymentPeriodSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayStr = getCdmxTodayString();
  const yesterdayStr = getCdmxYesterdayString();
  const weekStartStr = getCdmxPastDaysString(7);

  // Inicializar el mes visible del calendario según la fecha seleccionada o hoy
  const initialYearMonth = useMemo(() => {
    if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m] = selectedDate.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y, month: m - 1 };
  }, [selectedDate, todayStr]);

  const [currentYear, setCurrentYear] = useState(initialYearMonth.year);
  const [currentMonth, setCurrentMonth] = useState(initialYearMonth.month);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarOpen]);

  // Mapa de órdenes agrupadas por fecha exacta YYYY-MM-DD
  const ordersByDate = useMemo(() => {
    const map = new Map<string, { total: number; count: number; pendingCount: number }>();
    orders.forEach((order) => {
      if (order.status === 'cancelled' || order.paymentStatus === 'cancelled') return;
      const targetDate = extractOrderTargetDate(order, todayStr);
      const existing = map.get(targetDate) || { total: 0, count: 0, pendingCount: 0 };
      existing.total += order.total || 0;
      existing.count += 1;
      if (order.paymentStatus === 'pending') {
        existing.pendingCount += 1;
      }
      map.set(targetDate, existing);
    });
    return map;
  }, [orders, todayStr]);

  // Conteo de pedidos para los períodos predefinidos
  const periodCounts = useMemo(() => {
    let todayCount = 0;
    let todayPending = 0;
    let yesterdayCount = 0;
    let yesterdayPending = 0;
    let weekCount = 0;
    let weekPending = 0;
    let allCount = 0;
    let allPending = 0;

    orders.forEach((order) => {
      if (order.status === 'cancelled' || order.paymentStatus === 'cancelled') return;
      const targetDate = extractOrderTargetDate(order, todayStr);
      allCount += 1;
      if (order.paymentStatus === 'pending') allPending += 1;

      if (targetDate === todayStr) {
        todayCount += 1;
        if (order.paymentStatus === 'pending') todayPending += 1;
      }
      if (targetDate === yesterdayStr) {
        yesterdayCount += 1;
        if (order.paymentStatus === 'pending') yesterdayPending += 1;
      }
      if (targetDate >= weekStartStr && targetDate <= todayStr) {
        weekCount += 1;
        if (order.paymentStatus === 'pending') weekPending += 1;
      }
    });

    return {
      today: { count: todayCount, pending: todayPending },
      yesterday: { count: yesterdayCount, pending: yesterdayPending },
      week: { count: weekCount, pending: weekPending },
      all: { count: allCount, pending: allPending },
    };
  }, [orders, todayStr, yesterdayStr, weekStartStr]);

  // Resumen financiero del período actualmente seleccionado
  const periodSummary = useMemo(() => {
    let revenue = 0;
    let count = 0;
    let pendingCount = 0;

    orders.forEach((order) => {
      if (order.status === 'cancelled' || order.paymentStatus === 'cancelled') return;
      const targetDate = extractOrderTargetDate(order, todayStr);

      let matches = false;
      if (selectedDate === 'all') {
        matches = true;
      } else if (selectedDate === 'today') {
        matches = targetDate === todayStr;
      } else if (selectedDate === 'yesterday') {
        matches = targetDate === yesterdayStr;
      } else if (selectedDate === 'week') {
        matches = targetDate >= weekStartStr && targetDate <= todayStr;
      } else if (selectedDate === 'past') {
        matches = targetDate < todayStr;
      } else if (selectedDate === targetDate) {
        matches = true;
      }

      if (matches) {
        revenue += order.total || 0;
        count += 1;
        if (order.paymentStatus === 'pending') {
          pendingCount += 1;
        }
      }
    });

    let label = 'Período Activo';
    if (selectedDate === 'today') label = 'Hoy';
    else if (selectedDate === 'yesterday') label = 'Ayer';
    else if (selectedDate === 'week') label = 'Esta Semana';
    else if (selectedDate === 'all') label = 'Todo el Histórico';
    else if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) label = formatCdmxFriendlyDate(selectedDate);

    return { revenue, count, pendingCount, label };
  }, [orders, selectedDate, todayStr, yesterdayStr, weekStartStr]);

  // Generación de días del mes para el Mini Calendario
  const monthCalendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasOrders: boolean;
      orderCount: number;
      pendingCount: number;
    }> = [];

    // Días del mes anterior para rellenar la primera fila
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
      const y = prevMonthDate.getFullYear();
      const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const stats = ordersByDate.get(dateStr);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: selectedDate === dateStr,
        hasOrders: Boolean(stats && stats.count > 0),
        orderCount: stats?.count || 0,
        pendingCount: stats?.pendingCount || 0,
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const y = currentYear;
      const m = String(currentMonth + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const stats = ordersByDate.get(dateStr);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: selectedDate === dateStr,
        hasOrders: Boolean(stats && stats.count > 0),
        orderCount: stats?.count || 0,
        pendingCount: stats?.pendingCount || 0,
      });
    }

    // Días del siguiente mes para completar múltiplos de 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
      const y = nextMonthDate.getFullYear();
      const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const stats = ordersByDate.get(dateStr);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: selectedDate === dateStr,
        hasOrders: Boolean(stats && stats.count > 0),
        orderCount: stats?.count || 0,
        pendingCount: stats?.pendingCount || 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, ordersByDate, selectedDate, todayStr]);

  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    const mStr = d.toLocaleDateString('es-MX', { month: 'long' });
    return mStr.charAt(0).toUpperCase() + mStr.slice(1);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isSpecificDateSelected = selectedDate.match(/^\d{4}-\d{2}-\d{2}$/);

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* ─── Fila Principal: Accesos Rápidos de Período + Selector de Fecha + Resumen ─ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs">
        {/* Grupo de Botones de Período y Calendario */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted mr-1 hidden sm:inline">
            Período:
          </span>

          {/* ⚡ Hoy */}
          <button
            type="button"
            onClick={() => onSelectDate('today')}
            className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              selectedDate === 'today'
                ? 'bg-accent text-white shadow-xs ring-2 ring-accent/30'
                : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
            }`}
            title="Ver cobros de hoy"
          >
            <Zap className={`w-3.5 h-3.5 ${selectedDate === 'today' ? 'text-white' : 'text-emerald-500'}`} />
            <span>Hoy</span>
            {periodCounts.today.pending > 0 ? (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedDate === 'today' ? 'bg-white text-accent' : 'bg-amber-500 text-zinc-950 animate-pulse'
                }`}
              >
                {periodCounts.today.pending}
              </span>
            ) : periodCounts.today.count > 0 ? (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedDate === 'today' ? 'bg-white/20 text-white' : 'bg-surface text-text-muted'
                }`}
              >
                {periodCounts.today.count}
              </span>
            ) : null}
          </button>

          {/* ⏱️ Ayer */}
          <button
            type="button"
            onClick={() => onSelectDate('yesterday')}
            className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              selectedDate === 'yesterday'
                ? 'bg-accent text-white shadow-xs ring-2 ring-accent/30'
                : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
            }`}
            title="Ver cobros de ayer / cuadre de turno previo"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ayer</span>
            {periodCounts.yesterday.pending > 0 ? (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedDate === 'yesterday' ? 'bg-white text-accent' : 'bg-amber-500 text-zinc-950 animate-pulse'
                }`}
              >
                {periodCounts.yesterday.pending}
              </span>
            ) : periodCounts.yesterday.count > 0 ? (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedDate === 'yesterday' ? 'bg-white/20 text-white' : 'bg-surface text-text-muted'
                }`}
              >
                {periodCounts.yesterday.count}
              </span>
            ) : null}
          </button>

          {/* 📅 Esta Semana */}
          <button
            type="button"
            onClick={() => onSelectDate('week')}
            className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              selectedDate === 'week'
                ? 'bg-accent text-white shadow-xs ring-2 ring-accent/30'
                : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
            }`}
            title="Ver cobros acumulados de los últimos 7 días"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Esta Semana</span>
            {periodCounts.week.count > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedDate === 'week' ? 'bg-white/20 text-white' : 'bg-surface text-text-muted'
                }`}
              >
                {periodCounts.week.count}
              </span>
            )}
          </button>

          {/* 🌐 Todo el Histórico */}
          <button
            type="button"
            onClick={() => onSelectDate('all')}
            className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              selectedDate === 'all'
                ? 'bg-accent text-white shadow-xs ring-2 ring-accent/30'
                : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
            }`}
            title="Ver todos los cobros sin restricción de fecha"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Todo</span>
            {periodCounts.all.count > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedDate === 'all' ? 'bg-white/20 text-white' : 'bg-surface text-text-muted'
                }`}
              >
                {periodCounts.all.count}
              </span>
            )}
          </button>

          {/* 🗓️ Selector de Fecha Específica con Mini Calendario Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setCalendarOpen((prev) => !prev)}
              className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                isSpecificDateSelected
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
              }`}
              title="Abrir calendario para seleccionar una fecha específica"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{isSpecificDateSelected ? formatCdmxFriendlyDate(selectedDate) : 'Fecha Específica'}</span>
              {isSpecificDateSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* Popover Mini Calendario Mensual */}
            {calendarOpen && (
              <div className="absolute left-0 top-12 mt-1 z-50 w-80 p-4 bg-surface-card border border-line rounded-3xl shadow-floating space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Header del Calendario: Mes/Año y Controles */}
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-black text-text-primary">
                      {monthName} {currentYear}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                      title="Mes anterior"
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                      title="Mes siguiente"
                      aria-label="Mes siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-text-muted">
                  <span>Do</span>
                  <span>Lu</span>
                  <span>Ma</span>
                  <span>Mi</span>
                  <span>Ju</span>
                  <span>Vi</span>
                  <span>Sá</span>
                </div>

                {/* Cuadrícula de días */}
                <div className="grid grid-cols-7 gap-1">
                  {monthCalendarDays.map((day, idx) => (
                    <button
                      key={`${day.dateStr}-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectDate(day.dateStr);
                        setCalendarOpen(false);
                      }}
                      className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                        day.isSelected
                          ? 'bg-accent text-white shadow-xs font-black'
                          : day.isToday
                          ? 'bg-accent-soft text-accent ring-1 ring-accent font-black'
                          : day.isCurrentMonth
                          ? 'text-text-primary hover:bg-surface-raised'
                          : 'text-text-muted opacity-30 hover:opacity-70'
                      }`}
                    >
                      <span>{day.dayNumber}</span>
                      {/* Puntito indicador de cobros en ese día */}
                      {day.hasOrders && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            day.isSelected
                              ? 'bg-white'
                              : day.pendingCount > 0
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-emerald-500'
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Footer del Popover */}
                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Cobros</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Por confirmar</span>
                    </span>
                  </div>

                  {isSpecificDateSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDate('today');
                        setCalendarOpen(false);
                      }}
                      className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Ir a Hoy</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Badge Resumen Financiero del Período Activo ─────────────────────── */}
        <div className="flex items-center gap-2.5 bg-surface-raised px-3.5 py-2 rounded-2xl border border-line text-xs shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              {periodSummary.label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-accent">
                {formatCurrency(periodSummary.revenue)}
              </span>
              <span className="text-[11px] font-bold text-text-secondary">
                ({periodSummary.count} {periodSummary.count === 1 ? 'orden' : 'órdenes'})
              </span>
            </div>
          </div>

          {periodSummary.pendingCount > 0 && (
            <div className="ml-1 pl-2.5 border-l border-line flex items-center gap-1 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{periodSummary.pendingCount} por confirmar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
