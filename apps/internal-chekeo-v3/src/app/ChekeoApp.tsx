/**
 * ChekeoApp.tsx — Chekeo Cloud SaaS Platform
 *
 * Flujo Principal:
 * - Vista Raíz: SaaSHubView (Control Plane del SaaS, Gestión de Restaurantes y Proyectos)
 * - Vista Restaurante / POS: Chekeo AppShell para la marca seleccionada (Burgers.exe, Amsi Tortas, etc.)
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { TabsContent } from '@ui/tabs';
import { Skeleton } from '@ui/skeleton';
import { useAuthStore } from '../features/auth';
import { AppShell, ChekeoTab } from '../components/shell';
import { ResumenKView } from '../components/views/ResumenKView';
import { SaaSHubView } from '../components/views/SaaSHubView';

// Carga diferida (lazy loading) de vistas secundarias
const PedidosView = lazy(() =>
  import('../components/views/PedidosView').then((m) => ({ default: m.PedidosView }))
);
const CocinaView = lazy(() =>
  import('../components/views/CocinaView').then((m) => ({ default: m.CocinaView }))
);
const PagosView = lazy(() =>
  import('../components/views/PagosView').then((m) => ({ default: m.PagosView }))
);
const AdminView = lazy(() =>
  import('../components/views/AdminView').then((m) => ({ default: m.AdminView }))
);

function ViewLoadingFallback() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-surface-card p-4 rounded-3xl border border-line shadow-xs space-y-3">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
    </div>
  );
}

export function ChekeoApp() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const tenantFromUrl = urlParams?.get('tenant');
  const viewFromUrl = urlParams?.get('view');

  // Si no hay tenant especificado en la URL o el view es 'saas', mostramos el SaaS Hub
  const [isSaaSHubMode, setIsSaaSHubMode] = useState<boolean>(!tenantFromUrl || viewFromUrl === 'saas');
  const [activeTab, setActiveTab] = useState<ChekeoTab>('resumenK');
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLaunchTenantPos = (tenantId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tenant', tenantId);
    url.searchParams.delete('view');
    window.location.href = url.toString();
  };

  const handleReturnToSaaSHub = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('tenant');
    url.searchParams.set('view', 'saas');
    window.location.href = url.toString();
  };

  // 1. Vista Master: SaaS Hub (Centro de Mando de la Plataforma)
  if (isSaaSHubMode) {
    return <SaaSHubView onLaunchTenantPos={handleLaunchTenantPos} />;
  }

  // 2. Vista Tenant: Punto de Venta & Cocina de la Marca Seleccionada
  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReturnToSaaSHub={handleReturnToSaaSHub}
    >
      <TabsContent value="resumenK" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <ResumenKView onTabChange={setActiveTab} />
      </TabsContent>

      <TabsContent value="pedidos" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <Suspense fallback={<ViewLoadingFallback />}>
          <PedidosView />
        </Suspense>
      </TabsContent>

      <TabsContent value="cocina" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <Suspense fallback={<ViewLoadingFallback />}>
          <CocinaView />
        </Suspense>
      </TabsContent>

      <TabsContent value="pagos" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <Suspense fallback={<ViewLoadingFallback />}>
          <PagosView />
        </Suspense>
      </TabsContent>

      <TabsContent value="admin" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <Suspense fallback={<ViewLoadingFallback />}>
          <AdminView />
        </Suspense>
      </TabsContent>
    </AppShell>
  );
}
