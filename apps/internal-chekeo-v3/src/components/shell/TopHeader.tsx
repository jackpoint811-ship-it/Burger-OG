/**
 * TopHeader.tsx — Chekeo V3
 *
 * Barra superior operativa de Chekeo V3:
 * - Identidad y logo de Burgers.exe
 * - Reloj operativo CDMX en tiempo real
 * - Estado de sincronización en red (Online / Offline)
 * - Switch de tema (Light / Dark mode)
 * - Botón de bloqueo / cierre de sesión administrativa
 */

import React, { useState, useEffect } from 'react';
import { Clock, Wifi, WifiOff, Lock, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../features/auth';
import { BRAND_CONFIG } from '@config';
import { SplitFlapDepartmentBadge } from './SplitFlapDepartmentBadge';

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

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-card/90 backdrop-blur-md border-b border-line transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Izquierda: Identidad de Marca Burgers.exe */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-line shadow-xs"
            style={{ backgroundColor: `${BRAND_CONFIG.theme.accentColor}15` }}
          >
            {BRAND_CONFIG.logoEmoji}
          </div>
          <div className="text-left min-w-0">
            <span className="font-black text-sm sm:text-base text-text-primary truncate block">
              {BRAND_CONFIG.brandName}
            </span>
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
              Punto de Venta & Cocina
            </span>
          </div>
        </div>

        {/* Centro: Selector Split-Flap de Departamento y Reloj Operativo CDMX */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SplitFlapDepartmentBadge />

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-text-primary text-xs font-semibold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="font-mono text-sm tracking-wider font-bold">{timeStr || '--:--:--'}</span>
            <span className="text-text-muted text-xs capitalize">• {dateStr}</span>
            <span className="text-[10px] uppercase font-bold text-text-muted px-1 py-0.5 rounded bg-surface border border-line">
              CDMX
            </span>
          </div>
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
    </header>
  );
}
