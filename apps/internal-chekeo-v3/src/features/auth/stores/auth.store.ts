/**
 * auth.store.ts — PR-V3-08
 *
 * Zustand store para el manejo del estado de sesión y autenticación de Chekeo V3.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchAuthStatus, loginWithPin, logoutInternal } from '../api/auth.api';

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  isAuthenticated: boolean;
  status: AuthStatus;
  error: string | null;
  lastCheckedAt: number | null;
}

export interface AuthActions {
  checkSession: (force?: boolean) => Promise<boolean>;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      status: 'idle',
      error: null,
      lastCheckedAt: null,

      /**
       * Verifica la validez de la sesión con el backend.
       */
      checkSession: async (force = false) => {
        const { lastCheckedAt, status } = get();
        const now = Date.now();

        // Evitar múltiples llamadas concurrentes o comprobaciones redundantes en < 15 segundos salvo force
        if (!force && status === 'checking') {
          return get().isAuthenticated;
        }

        if (!force && lastCheckedAt && now - lastCheckedAt < 15000 && get().isAuthenticated) {
          return true;
        }

        set({ status: 'checking', error: null });

        try {
          const isValid = await fetchAuthStatus();
          set({
            isAuthenticated: isValid,
            status: isValid ? 'authenticated' : 'unauthenticated',
            lastCheckedAt: now,
            error: null,
          });
          return isValid;
        } catch (err: any) {
          const errorMsg = err?.message || 'Error verificando sesión.';
          set({
            isAuthenticated: false,
            status: 'unauthenticated',
            lastCheckedAt: now,
            error: errorMsg,
          });
          return false;
        }
      },

      /**
       * Inicia sesión con el PIN provisto.
       */
      login: async (pin: string) => {
        set({ status: 'checking', error: null });
        try {
          await loginWithPin(pin);
          set({
            isAuthenticated: true,
            status: 'authenticated',
            error: null,
            lastCheckedAt: Date.now(),
          });
          return true;
        } catch (err: any) {
          const message = err?.message || 'PIN inválido o no autorizado.';
          set({
            isAuthenticated: false,
            status: 'error',
            error: message,
          });
          return false;
        }
      },

      /**
       * Cierra la sesión activa y limpia el estado local.
       */
      logout: async () => {
        set({ status: 'checking' });
        try {
          await logoutInternal();
        } finally {
          set({
            isAuthenticated: false,
            status: 'unauthenticated',
            error: null,
            lastCheckedAt: Date.now(),
          });
        }
      },

      clearError: () => set({ error: null }),

      setAuthenticated: (authenticated: boolean) =>
        set({
          isAuthenticated: authenticated,
          status: authenticated ? 'authenticated' : 'unauthenticated',
          error: null,
        }),
    }),
    {
      name: 'burgers_chekeo_v3_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        lastCheckedAt: state.lastCheckedAt,
      }),
    }
  )
);

// ─── Selectores ───────────────────────────────────────────────────────────────

export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectAuthStatus = (s: AuthState) => s.status;
export const selectAuthError = (s: AuthState) => s.error;
