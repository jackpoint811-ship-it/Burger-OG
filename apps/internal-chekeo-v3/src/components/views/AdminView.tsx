/**
 * AdminView.tsx — Chekeo V3
 *
 * Vista principal de Administración para Chekeo V3:
 * - Protección exclusiva con PIN mediante AdminAuthGate
 * - Panel de Control V3 completo (Dashboard 2 Columnas, Favoritos y Breadcrumbs)
 * - Botón de '🔒 Bloquear Admin' para cerrar sesión administrativa con 1 clic
 */

import React from 'react';
import { Shield, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { useAuthStore } from '../../features/auth';
import { AdminAuthGate } from '../admin/AdminAuthGate';
import { AdminWorkspace } from '../admin/AdminWorkspace';

export function AdminView() {
  const { isAuthenticated, logout } = useAuthStore();

  // Si no está autenticado el PIN de administrador, mostrar la pantalla de candado PIN
  if (!isAuthenticated) {
    return <AdminAuthGate />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header del Panel de Control Administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent shrink-0 border border-accent/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-text-primary">
                Panel de Control Administrativo
              </h2>
              <Badge variant="default" className="text-[10px] bg-accent font-black">
                Sesión Master
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Gestión centralizada de catálogo, inventario en tiempo real, logística de torres, promociones y arqueo de caja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-raised border border-line text-xs font-bold text-text-primary shadow-xs">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Master Activo</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => logout()}
            className="h-9 px-3 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/15 gap-1.5 cursor-pointer"
            title="Bloquear panel de administración"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear Admin</span>
          </Button>
        </div>
      </div>

      {/* Admin Workspace con Dashboard en 2 Columnas y Submódulos */}
      <AdminWorkspace initialTab="overview" onLockAdmin={logout} />
    </div>
  );
}
