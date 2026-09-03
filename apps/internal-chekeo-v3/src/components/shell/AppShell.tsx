/**
 * AppShell.tsx — Chekeo V3
 *
 * Contenedor principal de la aplicación Chekeo V3:
 * - TopHeader con botón para volver al SaaS Hub
 * - Navegación accesible por pestañas
 */

import React, { useEffect } from 'react';
import { Tabs } from '@ui/tabs';
import { TopHeader } from './TopHeader';
import { NavTabs, ChekeoTab } from './NavTabs';
import { useDepartmentStore } from '../../features/shared';

interface AppShellProps {
  activeTab: ChekeoTab;
  onTabChange: (tab: ChekeoTab) => void;
  children: React.ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { activeDepartment } = useDepartmentStore();

  // Sincronizar activeTab cuando cambia el departamento maestro
  useEffect(() => {
    if (activeDepartment === 'cocina') {
      if (activeTab !== 'cocina' && activeTab !== 'resumenK') {
        onTabChange('cocina');
      }
    } else if (activeDepartment === 'admin') {
      if (activeTab === 'cocina') {
        onTabChange('resumenK');
      }
    }
  }, [activeDepartment, activeTab, onTabChange]);
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
