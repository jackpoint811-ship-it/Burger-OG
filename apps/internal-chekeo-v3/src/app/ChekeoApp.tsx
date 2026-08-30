/**
 * ChekeoApp.tsx — PR-V3-08
 *
 * Componente raíz de la aplicación Chekeo V3:
 * - AuthGate con validación de sesión automática y persistencia
 * - AppShell con TopHeader, reloj operativo y barra de navegación accesible
 * - Vistas modulares por pestañas (Pedidos, Cocina, Pagos y Admin)
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { TabsContent } from '@ui/tabs';
import { Skeleton } from '@ui/skeleton';
import { useAuthStore } from '../features/auth';
import { AppShell, ChekeoTab } from '../components/shell';
import { ResumenKView } from '../components/views/ResumenKView';

// Carga diferida (lazy loading) de vistas secundarias para optimizar el bundle inicial
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
  const [activeTab, setActiveTab] = useState<ChekeoTab>('resumenK');
  const { checkSession } = useAuthStore();

  // Comprobar estado de sesión con el backend al inicializar (silencioso para Admin)
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
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
