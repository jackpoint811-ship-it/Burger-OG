/**
 * use-towers.ts — PR-V3-05
 *
 * Hooks de TanStack Query para consultar horarios y disponibilidad de torres corporativas.
 */

import { useQuery } from '@tanstack/react-query';
import type { TowerSchedulePublic } from '@config/index';
import { fetchTowerSchedules } from '../api/towers.api';

export const towerKeys = {
  all: ['towers'] as const,
  lists: () => [...towerKeys.all, 'list'] as const,
  details: () => [...towerKeys.all, 'detail'] as const,
  detail: (towerKey: string) => [...towerKeys.details(), towerKey] as const,
};

/**
 * Hook principal para cargar los horarios de torres.
 */
export function useTowerSchedulesQuery(options?: { enabled?: boolean }) {
  return useQuery<TowerSchedulePublic[], Error>({
    queryKey: towerKeys.lists(),
    queryFn: fetchTowerSchedules,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook selector para obtener solo las torres activas.
 */
export function useActiveTowers() {
  const query = useTowerSchedulesQuery();
  const towers: TowerSchedulePublic[] = (query.data ?? []).filter((t) => t.isActive);

  return {
    ...query,
    towers,
  };
}

/**
 * Hook selector para buscar una torre específica por su towerKey.
 */
export function useTowerByKey(towerKey?: string) {
  const query = useTowerSchedulesQuery();
  const tower: TowerSchedulePublic | undefined = towerKey
    ? query.data?.find((t) => t.towerKey.toLowerCase() === towerKey.toLowerCase())
    : undefined;

  return {
    ...query,
    tower,
  };
}

/**
 * Helper para obtener la fecha y hora actual en Zona Horaria CDMX (America/Mexico_City).
 */
export function getMexicoCityDateTime() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const findPart = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

  const year = parseInt(findPart('year'), 10);
  const month = parseInt(findPart('month'), 10);
  const day = parseInt(findPart('day'), 10);
  let hours = parseInt(findPart('hour'), 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(findPart('minute'), 10);

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, dayOfWeek, hours, minutes, dateStr };
}

export type TowerAvailabilityStatus = {
  isOpen: boolean;
  isPaused: boolean;
  isClosedToday: boolean;
  isBeforeOpen: boolean;
  isPastCutoff: boolean;
  orderStartTime: string;
  orderEndTime: string;
  deliveryLabel: string | null;
  message?: string;
};

/**
 * Hook para evaluar la disponibilidad operativa de una torre (en tiempo real o para fecha programada).
 */
export function useTowerAvailability(towerKey?: string, scheduledDate?: string): {
  isLoading: boolean;
  status: TowerAvailabilityStatus | null;
  tower: TowerSchedulePublic | undefined;
} {
  const { tower, isLoading } = useTowerByKey(towerKey);

  if (isLoading || !tower) {
    return { isLoading, status: null, tower: undefined };
  }

  const mxNow = getMexicoCityDateTime();

  if (!tower.isActive) {
    return {
      isLoading: false,
      tower,
      status: {
        isOpen: false,
        isPaused: true,
        isClosedToday: false,
        isBeforeOpen: false,
        isPastCutoff: false,
        orderStartTime: tower.orderStartTime,
        orderEndTime: tower.orderEndTime,
        deliveryLabel: tower.deliveryLabel,
        message: `El servicio para ${tower.towerName} se encuentra pausado temporalmente.`,
      },
    };
  }

  // Si es pedido programado para una fecha futura
  if (scheduledDate) {
    const [sYear, sMonth, sDay] = scheduledDate.split('-').map((v) => parseInt(v, 10));
    const scheduledObj = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const scheduledDayOfWeek = scheduledObj.getUTCDay();

    const isDayAllowed = tower.activeDays.includes(scheduledDayOfWeek);
    return {
      isLoading: false,
      tower,
      status: {
        isOpen: isDayAllowed,
        isPaused: false,
        isClosedToday: !isDayAllowed,
        isBeforeOpen: false,
        isPastCutoff: false,
        orderStartTime: tower.orderStartTime,
        orderEndTime: tower.orderEndTime,
        deliveryLabel: tower.deliveryLabel,
        message: isDayAllowed
          ? undefined
          : `${tower.towerName} no recibe entregas en el día seleccionado.`,
      },
    };
  }

  // Pedido para hoy (mismo día)
  const isTodayAllowed = tower.activeDays.includes(mxNow.dayOfWeek);
  if (!isTodayAllowed) {
    return {
      isLoading: false,
      tower,
      status: {
        isOpen: false,
        isPaused: false,
        isClosedToday: true,
        isBeforeOpen: false,
        isPastCutoff: false,
        orderStartTime: tower.orderStartTime,
        orderEndTime: tower.orderEndTime,
        deliveryLabel: tower.deliveryLabel,
        message: `${tower.towerName} no recibe pedidos los días de hoy. Puedes programar para el próximo día hábil.`,
      },
    };
  }

  const [startH, startM] = (tower.orderStartTime || '09:00').split(':').map((v) => parseInt(v, 10));
  const [endH, endM] = (tower.orderEndTime || '13:30').split(':').map((v) => parseInt(v, 10));

  const isBefore = mxNow.hours < startH || (mxNow.hours === startH && mxNow.minutes < startM);
  const isAfter = mxNow.hours > endH || (mxNow.hours === endH && mxNow.minutes >= endM);

  if (isBefore) {
    return {
      isLoading: false,
      tower,
      status: {
        isOpen: false,
        isPaused: false,
        isClosedToday: false,
        isBeforeOpen: true,
        isPastCutoff: false,
        orderStartTime: tower.orderStartTime,
        orderEndTime: tower.orderEndTime,
        deliveryLabel: tower.deliveryLabel,
        message: `El servicio para ${tower.towerName} abre a las ${tower.orderStartTime}.`,
      },
    };
  }

  if (isAfter) {
    return {
      isLoading: false,
      tower,
      status: {
        isOpen: false,
        isPaused: false,
        isClosedToday: false,
        isBeforeOpen: false,
        isPastCutoff: true,
        orderStartTime: tower.orderStartTime,
        orderEndTime: tower.orderEndTime,
        deliveryLabel: tower.deliveryLabel,
        message: `El horario de pedidos de hoy para ${tower.towerName} cerró a las ${tower.orderEndTime}.`,
      },
    };
  }

  return {
    isLoading: false,
    tower,
    status: {
      isOpen: true,
      isPaused: false,
      isClosedToday: false,
      isBeforeOpen: false,
      isPastCutoff: false,
      orderStartTime: tower.orderStartTime,
      orderEndTime: tower.orderEndTime,
      deliveryLabel: tower.deliveryLabel,
    },
  };
}

/**
 * Helper para calcular la próxima fecha disponible de entrega para una torre (o lista de torres).
 */
export function getNextAvailableDeliveryDate(
  towerKeyOrName?: string,
  towers?: TowerSchedulePublic[]
): string {
  const mxNow = getMexicoCityDateTime();
  const [year, month, day] = mxNow.dateStr.split('-').map((v) => parseInt(v, 10));

  const targetTower = towers?.find(
    (t) =>
      t.towerKey.toLowerCase() === towerKeyOrName?.toLowerCase() ||
      t.towerName.toLowerCase() === towerKeyOrName?.toLowerCase()
  );

  const activeDays = targetTower?.activeDays && targetTower.activeDays.length > 0
    ? targetTower.activeDays
    : [1, 2, 3, 4, 5];

  for (let offset = 1; offset <= 14; offset++) {
    const candidate = new Date(Date.UTC(year, month - 1, day + offset));
    const dayOfWeek = candidate.getUTCDay();

    if (activeDays.includes(dayOfWeek)) {
      return candidate.toISOString().split('T')[0] ?? '';
    }
  }
  return mxNow.dateStr;
}
