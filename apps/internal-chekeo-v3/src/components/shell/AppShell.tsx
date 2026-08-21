/**
 * AppShell.tsx — PR-V3-08
 *
 * Contenedor principal de la aplicación Chekeo V3:
 * - TopHeader con métricas operativas
 * - Navegación accesible por pestañas
 * - Contenedor responsivo optimizado para tabletas de cocina, monitores POS y móviles
 */

import React from 'react';
import { Tabs } from '@ui/tabs';
import { TopHeader } from './TopHeader';
import { NavTabs, ChekeoTab } from './NavTabs';

interface AppShellProps {
  activeTab: ChekeoTab;
  onTabChange: (tab: ChekeoTab) => void;
  children: React.ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col transition-colors duration-200 text-text-primary">
      {/* Header Operativo */}
      <TopHeader />

      {/* Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as ChekeoTab)}
        className="flex-1 flex flex-col"
      >
        {/* Barra de Navegación por Pestañas */}
        <NavTabs activeTab={activeTab} onTabChange={onTabChange} />

        {/* Área Principal de Contenido */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 sm:pb-8">
          {children}
        </main>
      </Tabs>
    </div>
  );
}
