/**
 * AdminWorkspace.tsx — Chekeo V3
 *
 * Router y Orquestador del Panel de Control de Admin V3:
 * - Vista 1: Hub Principal en 2 Columnas (AdminHubGrid)
 * - Vista 2: Workspace Maestro-Detalle Dedicado a Pantalla Completa (AdminModuleWorkspace)
 * - Transiciones fluidas e inmersión completa
 */

import React, { useState } from 'react';
import type {
  AdminMasterCategory,
  AdminRouteState,
} from '../../features/admin/types/admin.types';
import { AdminHubGrid } from './AdminHubGrid';
import { AdminModuleWorkspace } from './AdminModuleWorkspace';

interface AdminWorkspaceProps {
  initialCategory?: AdminMasterCategory;
  onLockAdmin?: () => void;
}

export function AdminWorkspace({ initialCategory, onLockAdmin }: AdminWorkspaceProps) {
  const [routeState, setRouteState] = useState<AdminRouteState>(() => {
    if (initialCategory) {
      return { view: 'workspace', category: initialCategory };
    }
    return { view: 'hub' };
  });

  const handleOpenModule = (category: AdminMasterCategory, toolId?: string) => {
    setRouteState({
      view: 'workspace',
      category,
      toolId,
    });
  };

  const handleBackToHub = () => {
    setRouteState({ view: 'hub' });
  };

  return (
    <div className="w-full">
      {routeState.view === 'hub' ? (
        <AdminHubGrid
          onOpenModule={handleOpenModule}
          onLockAdmin={onLockAdmin}
        />
      ) : (
        routeState.category && (
          <AdminModuleWorkspace
            category={routeState.category}
            initialToolId={routeState.toolId}
            onBackToHub={handleBackToHub}
            onNavigateModule={handleOpenModule}
            onLockAdmin={onLockAdmin}
          />
        )
      )}
    </div>
  );
}
