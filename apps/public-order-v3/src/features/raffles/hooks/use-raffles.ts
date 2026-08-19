/**
 * use-raffles.ts — PR-V3-05
 *
 * Hooks de TanStack Query para sorteos activos, tickets y referidos.
 */

import { useQuery } from '@tanstack/react-query';
import type { RaffleCampaignPublicV2, RaffleTicketsLookupResponse } from '@config/index';
import {
  fetchActiveRaffle,
  fetchCampaignConfig,
  fetchReferralTickets,
  lookupRaffleTickets,
  type CampaignConfigData,
  type ReferralTicketsData,
} from '../api/raffles.api';

export const raffleKeys = {
  all: ['raffles'] as const,
  active: () => [...raffleKeys.all, 'active'] as const,
  config: () => [...raffleKeys.all, 'config'] as const,
  lookups: () => [...raffleKeys.all, 'lookup'] as const,
  lookup: (params: { phone?: string; code?: string }) =>
    [...raffleKeys.lookups(), params.phone ?? '', params.code ?? ''] as const,
  referrals: () => [...raffleKeys.all, 'referrals'] as const,
  referral: (phone: string) => [...raffleKeys.referrals(), phone] as const,
};

/**
 * Hook para consultar la campaña de sorteos activa en la app pública.
 */
export function useActiveRaffleQuery(options?: { enabled?: boolean }) {
  return useQuery<RaffleCampaignPublicV2 | null, Error>({
    queryKey: raffleKeys.active(),
    queryFn: fetchActiveRaffle,
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para consultar la configuración de visibilidad del botón de tickets.
 */
export function useCampaignConfigQuery(options?: { enabled?: boolean }) {
  return useQuery<CampaignConfigData, Error>({
    queryKey: raffleKeys.config(),
    queryFn: fetchCampaignConfig,
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para buscar tickets por número de teléfono o código de referido.
 */
export function useRaffleTicketsLookup(
  params: { phone?: string; code?: string },
  options?: { enabled?: boolean }
) {
  const hasValidQuery = Boolean(
    (params.phone && params.phone.replace(/\D/g, '').length >= 10) ||
      (params.code && params.code.trim().length >= 3)
  );

  return useQuery<RaffleTicketsLookupResponse, Error>({
    queryKey: raffleKeys.lookup(params),
    queryFn: () => lookupRaffleTickets(params),
    enabled: (options?.enabled ?? true) && hasValidQuery,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para consultar tickets por teléfono de cliente.
 */
export function useReferralTicketsQuery(phone?: string, options?: { enabled?: boolean }) {
  const normalized = phone ? phone.replace(/\D/g, '') : '';
  const isEligible = normalized.length >= 8;

  return useQuery<ReferralTicketsData, Error>({
    queryKey: raffleKeys.referral(normalized),
    queryFn: () => fetchReferralTickets(normalized),
    enabled: (options?.enabled ?? true) && isEligible,
    staleTime: 1000 * 60 * 2,
  });
}
