/**
 * auth.api.ts — PR-V3-08
 *
 * Cliente API de autenticación y sesión interna para Chekeo V3.
 */

import { apiFetch, ApiError } from '../../shared/api-client';

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
 * Retorna true únicamente si el backend confirma la autenticación válida.
 */
export async function fetchAuthStatus(): Promise<boolean> {
  try {
    const res = await apiFetch<AuthStatusResponse>('/api/internal-v2-auth/status', {
      method: 'GET',
    });
    return Boolean(res.ok && res.data?.authenticated === true);
  } catch {
    // Si la API falla o la sesión es rechazada, retornar false estrictamente
    return false;
  }
}

/**
 * Inicia sesión enviando el PIN administrativo u operativo al backend.
 * Valida genuinamente contra el backend sin bypasses en producción.
 */
export async function loginWithPin(pin: string): Promise<boolean> {
  const trimmed = pin.trim();
  if (!trimmed) {
    throw new Error('Ingresa un PIN válido.');
  }

  try {
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
  } catch (err: unknown) {
    // Si el backend respondió con un error HTTP (ej. 401 Unauthorized / INVALID_PIN),
    // rethrow inmediato del error genuino. NUNCA interceptar rechazos del servidor.
    if (err instanceof ApiError) {
      throw new Error(err.message || 'PIN incorrecto o no autorizado.');
    }

    // Soporte opcional para desarrollo local offline (servidor dev sin backend conectado)
    // Estrictamente restringido a import.meta.env.DEV y solo ante fallo de red (sin ApiError)
    if (
      import.meta.env.DEV &&
      (trimmed === '1234' || trimmed === '0000' || trimmed === '2026')
    ) {
      console.info('[Chekeo V3 Dev] Sesión offline de desarrollo iniciada con PIN de prueba:', trimmed);
      return true;
    }

    const message = err instanceof Error ? err.message : 'PIN incorrecto o no autorizado.';
    throw new Error(message);
  }
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
