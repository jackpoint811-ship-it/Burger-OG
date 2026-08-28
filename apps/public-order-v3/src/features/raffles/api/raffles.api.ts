/**
 * raffles.api.ts — PR-V3-05
 *
 * Llamadas de API para sorteos, campañas activas, consulta de tickets y códigos referidos.
 */

import type {
  RaffleActiveResponse,
  RaffleCampaignPublicV2,
  RaffleTicketsLookupResponse,
} from '@config/index';
import { apiFetch } from '../../shared/api-client';

const RAFFLES_ACTIVE_ENDPOINT = '/api/raffles-v2/active';
const RAFFLES_LOOKUP_ENDPOINT = '/api/raffles-v2/lookup';
const CAMPAIGN_CONFIG_ENDPOINT = '/api/campaign-config';
const REFERRAL_TICKETS_ENDPOINT = '/api/referral-tickets';

export type CampaignConfigData = {
  enabled: boolean;
  name: string;
  ticketsPageEnabled: boolean;
  ticketsPageUrl: string;
  menuCtaLabel: string;
};

type CampaignConfigResponse = {
  ok: boolean;
  data: CampaignConfigData;
};

export type ReferralTicketsData = {
  customerName: string;
  phoneMasked: string;
  referralCode: string;
  ticketsCount: number;
  ticketCountingMode: string;
  ticketsLabel: string;
  shareUrl: string;
};

type ReferralTicketsResponse = {
  ok: boolean;
  data: ReferralTicketsData;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Consulta la campaña de sorteo actualmente activa.
 */
export async function fetchActiveRaffle(): Promise<RaffleCampaignPublicV2 | null> {
  const data = await apiFetch<RaffleActiveResponse>(RAFFLES_ACTIVE_ENDPOINT, {
    cache: 'no-store',
  });

  return data.ok && data.data?.campaign ? data.data.campaign : null;
}

/**
 * Consulta el estado y configuración de la campaña de tickets.
 */
export async function fetchCampaignConfig(): Promise<CampaignConfigData> {
  const data = await apiFetch<CampaignConfigResponse>(CAMPAIGN_CONFIG_ENDPOINT, {
    cache: 'no-store',
  });

  return (
    data.data ?? {
      enabled: false,
      name: '',
      ticketsPageEnabled: false,
      ticketsPageUrl: '/tickets',
      menuCtaLabel: 'Consulta tus tickets',
    }
  );
}

/**
 * Consulta los tickets acumulados y código referido por teléfono o código.
 */
export async function lookupRaffleTickets(params: {
  phone?: string;
  code?: string;
}): Promise<RaffleTicketsLookupResponse> {
  const searchParams = new URLSearchParams();
  const normalizedPhone = (params.phone ?? '').replace(/\D/g, '');
  const normalizedCode = (params.code ?? '').trim().toUpperCase().slice(0, 32);

  if (normalizedPhone) searchParams.set('phone', normalizedPhone);
  if (normalizedCode) searchParams.set('code', normalizedCode);

  const url = `${RAFFLES_LOOKUP_ENDPOINT}?${searchParams.toString()}`;
  return apiFetch<RaffleTicketsLookupResponse>(url, {
    cache: 'no-store',
  });
}

/**
 * Consulta directa de tickets de referidos por teléfono.
 */
export async function fetchReferralTickets(phone: string): Promise<ReferralTicketsData> {
  const normalizedPhone = phone.replace(/\D/g, '');
  const url = `${REFERRAL_TICKETS_ENDPOINT}?phone=${encodeURIComponent(normalizedPhone)}`;

  const res = await apiFetch<ReferralTicketsResponse>(url, {
    cache: 'no-store',
  });

  if (!res.ok || !res.data) {
    throw new Error(res.error?.message || 'No se pudieron consultar los tickets para este teléfono.');
  }

  return res.data;
}
