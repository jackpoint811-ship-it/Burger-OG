/**
 * auth.api.ts — PR-V3-08
 *
 * Cliente API de autenticación y sesión interna para Chekeo V3.
 */

import { apiFetch } from '../../shared/api-client';

export interface AuthStatusResponse {
  ok: boolean;
  data?: {
    authenticated?: boolean;
  };
  error?: string | { code?: string; message?: string };
}

export interface AuthLoginResponse {
  ok: boolean;
  data?: {
    authenticated?: boolean;
  };
  error?: string | { code?: string; message?: string };
}

/**
 * Consulta el estado de autenticación y validez de la cookie de sesión actual.
 */
export async function fetchAuthStatus(): Promise<boolean> {
  try {
    const res = await apiFetch<AuthStatusResponse>('/api/internal-v2-auth/status', {
      method: 'GET',
    });
    return Boolean(res.ok && res.data?.authenticated === true);
  } catch {
    return false;
  }
}

/**
 * Inicia sesión enviando el PIN administrativo u operativo.
 */
export async function loginWithPin(pin: string): Promise<boolean> {
  const trimmed = pin.trim();
  if (!trimmed) {
    throw new Error('Ingresa un PIN válido.');
  }

  const res = await apiFetch<AuthLoginResponse>('/api/internal-v2-auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin: trimmed }),
  });

  if (!res.ok || !res.data?.authenticated) {
    throw new Error('PIN incorrecto o sesión rechazada.');
  }

  return true;
}

/**
 * Cierra la sesión activa en el servidor eliminando la cookie de autenticación.
 */
export async function logoutInternal(): Promise<void> {
  try {
    await apiFetch('/api/internal-v2-auth/logout', {
      method: 'POST',
    });
  } catch {
    // Ignorar fallo de red en logout para garantizar limpieza del cliente
  }
}
