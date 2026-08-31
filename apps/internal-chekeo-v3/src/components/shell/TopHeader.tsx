/**
 * TopHeader.tsx — Chekeo V3 + SaaS Hub Navigation
 *
 * Barra superior operativa de Chekeo V3:
 * - Botón para volver al Hub Central del SaaS
 * - Selector de Marca / Inquilino Multi-Tenant
 * - Reloj operativo CDMX en tiempo real
 * - Estado de sincronización en red (Online / Offline)
 * - Switch de tema (Light / Dark mode)
 * - Botón de cierre de sesión
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Wifi, WifiOff, Lock, Sun, Moon, ChevronDown, Plus, Check, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../features/auth';
import { getActiveTenant, TENANTS_REGISTRY } from '@config';
import { TenantOnboardingModal } from '../admin/TenantOnboardingModal';
import { Button } from '@ui/button';

export interface TopHeaderProps {
  onReturnToSaaSHub?: () => void;
}

export function TopHeader({ onReturnToSaaSHub }: TopHeaderProps) {
  const { isAuthenticated, logout } = useAuthStore();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isDark, setIsDark] = useState(false);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tenant = getActiveTenant();

  // Inicialización de tema
  useEffect(() => {
    const isDarkMode =
      document.documentElement.classList.contains('theme-dark') ||
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('chekeo_theme') === 'dark' ||
      (!('chekeo_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('theme-dark', 'dark');
      localStorage.setItem('chekeo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark', 'dark');
      localStorage.setItem('chekeo_theme', 'light');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrandMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reloj operativo en tiempo real CDMX
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatted = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);

      const dateFormatted = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(now);

      setTimeStr(timeFormatted);
      setDateStr(dateFormatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor de red Online / Offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSelectTenant = (tenantKey: string) => {
    setIsBrandMenuOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set('tenant', tenantKey);
    url.searchParams.delete('view');
    window.location.href = url.toString();
  };

  const handleGoToHub = () => {
    if (onReturnToSaaSHub) {
      onReturnToSaaSHub();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('tenant');
      url.searchParams.set('view', 'saas');
      window.location.href = url.toString();
    }
  };

  const registeredTenants = Object.entries(TENANTS_REGISTRY).filter(
    ([key], index, self) => self.findIndex(([, val]) => val.id === key) === index
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-card/90 backdrop-blur-md border-b border-line transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Izquierda: Botón SaaS Hub + Selector de Marca */}
        <div className="flex items-center gap-2">
          {/* Botón Volver a SaaS Hub */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoToHub}
            className="h-10 px-3 rounded-2xl text-xs font-black gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 cursor-pointer active:scale-98 shadow-xs"
            title="Volver al Centro de Mando del SaaS"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">SaaS Hub</span>
          </Button>

          {/* Selector de Marca Dropdown */}
          <div className="relative flex items-center gap-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl border border-line bg-surface hover:bg-surface-raised transition-all cursor-pointer select-none active:scale-98 focus-visible:ring-2 focus-visible:ring-accent"
              title="Cambiar de Restaurante"
            >
              <span className="text-xl shrink-0">{tenant.logoEmoji}</span>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm sm:text-base text-text-primary truncate">
                    {tenant.brandName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                </div>
                <span className="hidden sm:block text-[10px] font-bold text-accent uppercase tracking-wider">
                  Restaurante Activo
                </span>
              </div>
            </button>

            {/* Menú Desplegable de Marcas */}
            {isBrandMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-2 bg-surface-card rounded-2xl border border-line shadow-xl z-50 animate-in fade-in-0 zoom-in-95 space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-text-muted">
                  <span>Cambiar de Marca</span>
                  <span>{registeredTenants.length} registradas</span>
                </div>

                {registeredTenants.map(([key, t]) => {
                  const isCurrent = t.id === tenant.id;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectTenant(t.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-accent/10 text-accent font-black border border-accent/20'
                          : 'hover:bg-surface-raised text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{t.logoEmoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs truncate font-bold">{t.brandName}</p>
                          <p className="text-[10px] text-text-muted truncate">{t.shortName}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-1 border-t border-line/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBrandMenuOpen(false);
                      setIsOnboardingOpen(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-black text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Lanzar Nuevo Restaurante</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Centro: Reloj Operativo en Tiempo Real */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-text-primary text-xs font-semibold shadow-xs">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="font-mono text-sm tracking-wider font-bold">{timeStr || '--:--:--'}</span>
          <span className="text-text-muted text-xs capitalize">• {dateStr}</span>
          <span className="text-[10px] uppercase font-bold text-text-muted px-1 py-0.5 rounded bg-surface border border-line">
            CDMX
          </span>
        </div>

        {/* Derecha: Sync Status, Theme Toggle y Botón Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Indicador de Sincronización */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 border-red-500/20'
            }`}
            title={isOnline ? 'Conexión de red operativa' : 'Sin conexión a internet'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Sincronizado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span className="hidden sm:inline">Desconectado</span>
              </>
            )}
          </div>

          {/* Toggle de Modo Oscuro / Claro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-11 min-w-11 w-11 h-11 rounded-xl border border-line bg-surface-raised hover:bg-surface text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Botón Bloquear Admin */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => logout()}
              className="min-h-11 h-11 px-3.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              title="Bloquear y cerrar sesión administrativa"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Onboarding */}
      <TenantOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </header>
  );
}
