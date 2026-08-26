/**
 * TopHeader.tsx — PR-V3-08
 *
 * Barra superior operativa de Chekeo V3:
 * - Indicador de entorno (Producción / Preview / Dev)
 * - Reloj operativo CDMX en tiempo real
 * - Estado de sincronización en red (Online / Offline)
 * - Switch de tema (Light / Dark mode)
 * - Botón de cierre de sesión
 */

import React, { useState, useEffect } from 'react';
import { Clock, Wifi, WifiOff, LogOut, Lock, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../features/auth';

export function TopHeader() {
  const { isAuthenticated, logout } = useAuthStore();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isDark, setIsDark] = useState(false);

  // Inicialización de tema
  useEffect(() => {
    const isDarkMode =
      document.documentElement.classList.contains('theme-dark') ||
      localStorage.getItem('chekeo_theme') === 'dark' ||
      (!('chekeo_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('theme-dark');
      localStorage.setItem('chekeo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      localStorage.setItem('chekeo_theme', 'light');
    }
  };

  // Reloj operativo en tiempo real CDMX
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Formato hora CDMX
      const timeFormatted = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);

      // Formato fecha corta
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

  // Detección de entorno
  const isProduction =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('burgers') &&
    !window.location.hostname.includes('preview') &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1');

  const envLabel = isProduction
    ? 'PRODUCCIÓN'
    : window.location.hostname.includes('preview')
    ? 'PREVIEW'
    : 'DEV';

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-card/90 backdrop-blur-md border-b border-line transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Izquierda: Logotipo y Badge de Entorno */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-black text-lg sm:text-xl tracking-tight text-text-primary">
            <span>Burgers</span>
            <span className="text-accent">.exe</span>
          </div>

          <span className="hidden xs:inline-flex px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[11px] font-extrabold uppercase tracking-wider">
            CHEKEO V3
          </span>

          {/* Badge de Entorno */}
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isProduction
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}
            title={`Entorno activo: ${envLabel}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isProduction ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span>{envLabel}</span>
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
            className="w-9 h-9 rounded-xl border border-line bg-surface-raised hover:bg-surface text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Botón Bloquear Admin (Solo visible cuando la sesión de administración está activa) */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => logout()}
              className="h-9 px-3 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Bloquear y cerrar sesión administrativa"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
