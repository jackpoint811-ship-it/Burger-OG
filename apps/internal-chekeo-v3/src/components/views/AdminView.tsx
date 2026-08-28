/**
 * AdminView.tsx — Chekeo V3
 *
 * Vista principal de Administración para Chekeo V3:
 * - Protección exclusiva con PIN mediante AdminAuthGate
 * - Panel de Control V3 completo (Hub en 2 Columnas, Submenús y Breadcrumbs)
 * - Botón de '🔒 Bloquear Admin' para cerrar sesión administrativa con 1 clic
 */

import React from 'react';
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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Admin Workspace Central con Routing Jerárquico */}
      <AdminWorkspace onLockAdmin={logout} />
    </div>
  );
}
