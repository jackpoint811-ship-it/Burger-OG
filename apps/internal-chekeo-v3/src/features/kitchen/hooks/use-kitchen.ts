/**
 * use-kitchen.ts — PR-V3-10
 *
 * Hooks de TanStack Query v5, temporizadores en tiempo real, síntesis de audio
 * y agregadores reactivos para la Pantalla KDS y Resumen K de Cocina.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  OrderV2,
  OrderV2Status,
  OrderV2Environment,
  UpdateKitchenItemPayload,
} from '@config/index';
import {
  useChekeoOrdersQuery,
  useUpdateOrderStatusMutation,
  chekeoOrderKeys,
} from '../../orders';
import {
  fetchKitchenSummaryK,
  updateKitchenItemStatus,
  getDefaultKitchenEnvironment,
} from '../api/kitchen.api';
import {
  orderToKitchenTicket,
  computeKitchenAggregates,
  type KitchenTicket,
  type KitchenStation,
  type AggregatedMiseEnPlace,
} from '../types/kitchen.types';

// ─── Query Keys para Cocina ───────────────────────────────────────────────────

export const kitchenKeys = {
  all: ['kitchen'] as const,
  summaryK: (date?: string, environment?: OrderV2Environment) =>
    [...kitchenKeys.all, 'summary-k', date, environment] as const,
};

// ─── Generador de Audio para Cocina (Web Audio API) ──────────────────────────

const SOUND_STORAGE_KEY = 'burgers_kds_sound_enabled';

/**
 * Reproduce un sonido armónico tipo chime para alertar sobre nuevas comandas
 * o pedidos demorados sin requerir assets externos de audio.
 */
function playKdsChime(type: 'new_order' | 'warning' | 'urgent' = 'new_order') {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === 'new_order') {
      // Acorde brillante ascendente (F5 -> A5 -> C6)
      const notes = [698.46, 880.0, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } else if (type === 'urgent') {
      // Alerta de atención doble tono
      [800, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        gain.gain.setValueAtTime(0.001, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.3);
      });
    }
  } catch {
    // Si el navegador bloquea el audio autoplay o no tiene soporte, continuar sin error
  }
}

// ─── Hook Principal de Cocina KDS ─────────────────────────────────────────────

export interface UseKitchenDisplayOptions {
  autoRefresh?: boolean;
  refetchIntervalMs?: number;
  environment?: OrderV2Environment;
}

export function useKitchenDisplay(options: UseKitchenDisplayOptions = {}) {
  const { autoRefresh = true, refetchIntervalMs = 10000, environment } = options;

  // Estado del sonido persistente en localStorage
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  }, []);


  // Consulta de pedidos activos
  const {
    orders,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useChekeoOrdersQuery({
    includeTerminal: false,
    autoRefresh,
    refetchIntervalMs,
    environment,
  });

  // Detectar nuevas comandas que lleguen y hacer sonido si el audio está activo
  const prevOrderCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoading && orders.length > 0) {
      if (prevOrderCountRef.current !== null && orders.length > prevOrderCountRef.current && soundEnabled) {
        playKdsChime('new_order');
      }
      prevOrderCountRef.current = orders.length;
    }
  }, [orders.length, isLoading, soundEnabled]);

  // Filtrar y ordenar comandas activas
  const activeTickets = useMemo(() => {
    return orders
      .filter((o) => o.status === 'new' || o.status === 'preparing' || o.status === 'ready')
      .map(orderToKitchenTicket)
      .sort((a, b) => a.createdAtMs - b.createdAtMs); // Las más antiguas primero (FIFO)
  }, [orders]);

  // Separar en columnas Kanban
  const newTickets = useMemo(
    () => activeTickets.filter((t) => t.status === 'new'),
    [activeTickets]
  );
  const preparingTickets = useMemo(
    () => activeTickets.filter((t) => t.status === 'preparing'),
    [activeTickets]
  );
  const readyTickets = useMemo(
    () => activeTickets.filter((t) => t.status === 'ready'),
    [activeTickets]
  );

  // Cómputo de insumos en vivo (Resumen K)
  const aggregates: AggregatedMiseEnPlace = useMemo(() => {
    return computeKitchenAggregates(activeTickets);
  }, [activeTickets]);

  // Mutación de cambio de estado
  const updateStatusMutation = useUpdateOrderStatusMutation();

  /**
   * Avanza un ticket al siguiente estado con 1 clic:
   * - new / preparing -> ready (Marcar listo / Hecha)
   * - ready -> delivered (Entregar / Despachar)
   */
  const advanceTicketStatus = useCallback(
    async (ticketId: string, currentStatus: OrderV2Status) => {
      let nextStatus: OrderV2Status | null = null;
      if (currentStatus === 'new' || currentStatus === 'preparing') nextStatus = 'ready';
      else if (currentStatus === 'ready') nextStatus = 'delivered';

      if (!nextStatus) return;

      await updateStatusMutation.mutateAsync({
        orderId: ticketId,
        status: nextStatus,
        environment,
      });
    },
    [updateStatusMutation, environment]
  );

  /**
   * Retrocede un ticket al estado previo en caso de clic accidental:
   * - ready -> preparing
   * - preparing -> new
   */
  const revertTicketStatus = useCallback(
    async (ticketId: string, currentStatus: OrderV2Status) => {
      let prevStatus: OrderV2Status | null = null;
      if (currentStatus === 'ready') prevStatus = 'preparing';
      else if (currentStatus === 'preparing') prevStatus = 'new';

      if (!prevStatus) return;

      await updateStatusMutation.mutateAsync({
        orderId: ticketId,
        status: prevStatus,
        environment,
      });
    },
    [updateStatusMutation, environment]
  );

  return {
    tickets: activeTickets,
    newTickets,
    preparingTickets,
    readyTickets,
    aggregates,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    soundEnabled,
    toggleSound,
    advanceTicketStatus,
    revertTicketStatus,
    isUpdating: updateStatusMutation.isPending,
  };
}

// ─── Hook para Resumen K de Insumos Backend D1 ───────────────────────────────

export function useKitchenSummaryKQuery(
  date?: string,
  environment?: OrderV2Environment,
  enabled = true
) {
  const env = environment || getDefaultKitchenEnvironment();

  return useQuery({
    queryKey: kitchenKeys.summaryK(date, env),
    queryFn: () => fetchKitchenSummaryK(date, env),
    staleTime: 15000,
    refetchInterval: 30000,
    enabled,
  });
}

// ─── Hook para Mutación de Ítems Individuales de Cocina ───────────────────────

export function useUpdateKitchenItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateKitchenItemPayload;
    }) => updateKitchenItemStatus(orderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chekeoOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
    },
  });
}

// ─── Hook para Seguimiento Reactivo de Ítems Granulares ────────────────────────

const KITCHEN_CHECKS_STORAGE_KEY = 'burgers_kds_item_checks_v3';

function readStoredChecks(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KITCHEN_CHECKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredChecks(checks: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KITCHEN_CHECKS_STORAGE_KEY, JSON.stringify(checks));
  } catch {
    // Silencioso
  }
}

export function useKitchenItemTracking() {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => readStoredChecks());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === KITCHEN_CHECKS_STORAGE_KEY && e.newValue) {
        try {
          setCheckedMap(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isUnitDone = useCallback(
    (unitKey: string): boolean => {
      return Boolean(checkedMap[unitKey]);
    },
    [checkedMap]
  );

  const toggleUnitDone = useCallback((unitKey: string) => {
    setCheckedMap((prev) => {
      const next = { ...prev, [unitKey]: !prev[unitKey] };
      writeStoredChecks(next);
      return next;
    });
  }, []);

  const getTicketProgress = useCallback(
    (ticket: KitchenTicket) => {
      const units = ticket.productionUnits || [];
      const totalUnits = units.length;

      const prepUnits = units.filter((u) => u.station === 'prep');
      const sideUnits = units.filter((u) => u.station === 'sideQuest');

      const prepCompleted = prepUnits.filter((u) => checkedMap[u.unitKey]).length;
      const sideCompleted = sideUnits.filter((u) => checkedMap[u.unitKey]).length;
      const completedUnits = prepCompleted + sideCompleted;

      const isPrepDone = prepUnits.length === 0 || prepCompleted === prepUnits.length;
      const isSideQuestDone = sideUnits.length === 0 || sideCompleted === sideUnits.length;
      const isFullyDone = totalUnits > 0 && completedUnits === totalUnits;

      return {
        totalUnits,
        completedUnits,
        prepTotal: prepUnits.length,
        prepCompleted,
        sideTotal: sideUnits.length,
        sideCompleted,
        isPrepDone,
        isSideQuestDone,
        isFullyDone,
      };
    },
    [checkedMap]
  );

  return {
    checkedMap,
    isUnitDone,
    toggleUnitDone,
    getTicketProgress,
  };
}
