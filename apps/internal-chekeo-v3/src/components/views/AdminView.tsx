/**
 * AdminView.tsx — PR-V3-12
 *
 * Vista principal de Administración para Chekeo V3.
 * Integra el AdminWorkspace con todos sus submódulos operativos:
 * - Menú & Stock
 * - Torres & Horarios
 * - Banners Promocionales
 * - Sorteos & Boletos
 * - Corte de Caja (Corte Z)
 * - Insumos & Recetas
 */

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Badge } from '@ui/badge';
import { AdminWorkspace } from '../admin/AdminWorkspace';

export function AdminView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header del Panel de Control Administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              Panel de Control Administrativo
              <Badge variant="default" className="text-[10px]">
                En Vivo
              </Badge>
            </h2>
            <p className="text-xs text-text-secondary">
              Gestión centralizada de catálogo, inventario en tiempo real, logística de torres, promociones y arqueo de caja.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-raised border border-line text-xs font-semibold text-text-primary self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Sesión Master Activa</span>
        </div>
      </div>

      {/* Admin Workspace con Submódulos Modulares */}
      <AdminWorkspace initialTab="menu" />
    </div>
  );
}
