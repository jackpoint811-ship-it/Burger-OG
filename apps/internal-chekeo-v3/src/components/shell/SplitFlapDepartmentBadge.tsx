/**
 * SplitFlapDepartmentBadge.tsx — Chekeo V3
 *
 * Selector e indicador de departamento maestro con animación Split-Flap 3D:
 * - Estilo mecánico inspirado en tableros Solari de solapas
 * - Doble interacción táctil:
 *   - 1 Tap rápido (<400ms): Conmutación instantánea (Cocina ↔ Admin) con giro 3D y sonido clack
 *   - Long-press (>450ms): Menú flotante (Dropdown) con selección directa y métricas
 * - Síntesis de sonido nativa con Web Audio API (cero assets externos)
 * - Atajos de teclado: Alt+1 (Cocina), Alt+2 (Admin), Alt+D (Conmutar)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChefHat,
  Shield,
  Volume2,
  VolumeX,
  Check,
  Flame,
  CreditCard,
  Sparkles,
  Command,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { useDepartmentStore, type ChekeoDepartment } from '../../features/shared';
import { useChekeoOrdersQuery } from '../../features/orders';

function playSplitFlapClick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.022);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch {
    // Ignorar si el navegador bloquea audio sin interacción previa
  }
}

export function SplitFlapDepartmentBadge() {
  const {
    activeDepartment,
    toggleDepartment,
    setDepartment,
    soundEnabled,
    toggleSound,
  } = useDepartmentStore();

  const { orders } = useChekeoOrdersQuery({ autoRefresh: true, refetchIntervalMs: 15000 });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const badgeButtonRef = useRef<HTMLButtonElement>(null);

  const shouldReduceMotion = useReducedMotion();

  // Métricas reactivas para el dropdown
  const metrics = React.useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );
    const pendingPayments = activeOrders.filter((o) => o.paymentStatus === 'pending');
    const inKitchen = activeOrders.filter(
      (o) => o.status === 'new' || o.status === 'preparing'
    );
    return {
      kitchenCount: inKitchen.length,
      pendingPaymentsCount: pendingPayments.length,
    };
  }, [orders]);

  // Atajos de teclado: Alt+1 (Cocina), Alt+2 (Admin), Alt+D (Toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input o textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && (e.key === '1' || e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (soundEnabled) playSplitFlapClick();
        setDepartment('cocina');
      } else if (e.altKey && (e.key === '2' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (soundEnabled) playSplitFlapClick();
        setDepartment('admin');
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (soundEnabled) playSplitFlapClick();
        toggleDepartment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDepartment, toggleDepartment, soundEnabled]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        badgeButtonRef.current &&
        !badgeButtonRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  // Manejadores de gestos (Tap vs Long-press)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Solo click principal
    setIsPressing(true);
    isLongPressRef.current = false;

    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressing(false);
      setIsDropdownOpen(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
    }, 450);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(false);

    // Si no fue long press, ejecuta conmutación
    if (!isLongPressRef.current) {
      if (soundEnabled) playSplitFlapClick();
      toggleDepartment();
    }
    isLongPressRef.current = false;
  };

  const handlePointerCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(false);
    isLongPressRef.current = false;
  };

  const isCocina = activeDepartment === 'cocina';

  return (
    <div className="relative inline-flex items-center">
      {/* ─── Botón Split-Flap Display ────────────────────────────────────────── */}
      <button
        ref={badgeButtonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()} // Previene menú contextual en móvil para favorecer long-press
        aria-label={`Departamento actual: ${isCocina ? 'Cocina' : 'Administración'}. Toca para alternar o mantén presionado para opciones.`}
        title="Toca para cambiar de departamento · Mantén presionado para menú (Alt+1 / Alt+2)"
        className={`group relative flex items-center justify-between h-11 px-3 sm:px-3.5 rounded-xl border border-zinc-700/80 dark:border-zinc-800 bg-zinc-950 text-white shadow-md select-none cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isPressing ? 'scale-[0.96] ring-2 ring-accent/50' : 'hover:border-zinc-500 hover:shadow-lg'
        }`}
        style={{ perspective: 800 }}
      >
        {/* Remaches mecánicos en esquinas */}
        <span className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-zinc-600/70 shadow-xs pointer-events-none" />
        <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-zinc-600/70 shadow-xs pointer-events-none" />
        <span className="absolute bottom-1 left-1.5 w-1 h-1 rounded-full bg-zinc-600/70 shadow-xs pointer-events-none" />
        <span className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-zinc-600/70 shadow-xs pointer-events-none" />

        {/* Ranura horizontal divisoria mecánica (Split seam) */}
        <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/90 shadow-[0_1px_0_rgba(255,255,255,0.08)] pointer-events-none z-10" />

        {/* Contenido animado de solapa Split-Flap 3D */}
        <div className="flex items-center gap-2 relative z-0 pr-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeDepartment}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { rotateX: 90, opacity: 0, scale: 0.95 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { rotateX: 0, opacity: 1, scale: 1 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { rotateX: -90, opacity: 0, scale: 0.95 }
              }
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="flex items-center gap-2"
            >
              {/* Icono del departamento con glow */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shadow-xs ${
                  isCocina
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isCocina ? <ChefHat className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              </div>

              {/* Texto en fuente monoespaciada tipo Solari */}
              <div className="flex flex-col text-left leading-none">
                <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-zinc-100">
                  {isCocina ? 'COCINA' : 'ADMIN'}
                </span>
                <span className="text-[9px] font-mono tracking-wider font-semibold text-zinc-400 mt-0.5">
                  {isCocina ? 'KDS · PLANCHA' : 'CAJA · TURNO'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicador sutil de dropdown / atajo */}
        <div className="flex items-center gap-1 pl-1.5 border-l border-zinc-800 text-zinc-400 group-hover:text-zinc-200 transition-colors">
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        </div>
      </button>

      {/* ─── Menú Flotante Dropdown (Long-press / Selección Rápida) ──────────── */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-surface-card border border-line rounded-2xl shadow-panel p-3 z-50 space-y-2.5 backdrop-blur-md"
          >
            {/* Cabecera del Dropdown */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-line">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                  Departamentos Chekeo V3
                </span>
              </div>

              {/* Toggle de Sonido Mecánico */}
              <button
                type="button"
                onClick={toggleSound}
                className="p-1 rounded-lg hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title={soundEnabled ? 'Silenciar sonido Split-Flap' : 'Activar sonido Split-Flap'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-text-muted" />
                )}
              </button>
            </div>

            {/* Opción 1: Departamento de Cocina */}
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playSplitFlapClick();
                setDepartment('cocina');
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                isCocina
                  ? 'bg-amber-500/10 border-amber-500/40 text-text-primary shadow-xs'
                  : 'bg-surface-raised/60 border-line hover:border-zinc-400 hover:bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 font-bold">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-text-primary">
                      Cocina & KDS
                    </span>
                    <span className="text-[10px] font-mono font-bold text-text-muted">
                      Alt+1
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate">
                    Plancha, Freidora y Resumen K
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {metrics.kitchenCount > 0 && (
                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                    {metrics.kitchenCount} en fuego
                  </Badge>
                )}
                {isCocina && <Check className="w-4 h-4 text-amber-500" />}
              </div>
            </button>

            {/* Opción 2: Departamento de Administración */}
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playSplitFlapClick();
                setDepartment('admin');
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                !isCocina
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-text-primary shadow-xs'
                  : 'bg-surface-raised/60 border-line hover:border-zinc-400 hover:bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-text-primary">
                      Administración & Turno
                    </span>
                    <span className="text-[10px] font-mono font-bold text-text-muted">
                      Alt+2
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate">
                    Operación, Pedidos, Pagos y Catálogo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {metrics.pendingPaymentsCount > 0 && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-accent text-white">
                    {metrics.pendingPaymentsCount} por cobrar
                  </Badge>
                )}
                {!isCocina && <Check className="w-4 h-4 text-emerald-500" />}
              </div>
            </button>

            {/* Tip y Atajos */}
            <div className="pt-1 border-t border-line/60 flex items-center justify-between text-[10px] text-text-muted px-1">
              <span>💡 Tip: Toca el badge para conmutar rápido</span>
              <span className="font-mono">Alt+D</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
