/**
 * api-client.ts — PR-V3-08
 *
 * Cliente HTTP base para requests de Chekeo V3 con credenciales de sesión y manejo estructurado de errores.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Las peticiones internas de Chekeo incluyen cookies de sesión por defecto
  const response = await fetch(endpoint, {
    credentials: 'include',
    ...options,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorCode = 'HTTP_ERROR';
    let errorMessage = `Request failed with status ${response.status}`;

    if (data && typeof data === 'object') {
      if (typeof data.code === 'string') {
        errorCode = data.code;
      } else if (data.error && typeof data.error === 'object' && typeof data.error.code === 'string') {
        errorCode = data.error.code;
      } else if (typeof data.error === 'string') {
        errorCode = data.error;
      }

      if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
        errorMessage = data.error.message;
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      }
    }

    throw new ApiError(response.status, errorCode, errorMessage, data);
  }

  return data as T;
}
