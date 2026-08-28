/**
 * towers.api.ts — PR-V3-05
 *
 * Llamadas de API para consultar los horarios y configuración de entrega por torre.
 */

import type { TowerSchedulePublic } from '@config/index';
import { apiFetch } from '../../shared/api-client';

const TOWERS_ENDPOINT = '/api/tower-schedules';

type TowerSchedulesResponse = {
  ok: boolean;
  towers: TowerSchedulePublic[];
  source?: string;
  error?: string;
};

export async function fetchTowerSchedules(): Promise<TowerSchedulePublic[]> {
  const data = await apiFetch<TowerSchedulesResponse>(TOWERS_ENDPOINT, {
    cache: 'no-store',
  });

  if (!data?.ok || !Array.isArray(data?.towers)) {
    throw new Error(data?.error || 'No se pudieron cargar los horarios de entrega por torre.');
  }

  return data.towers;
}
