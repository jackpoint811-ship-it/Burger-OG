/**
 * ChekeoApp.tsx — PR-V3-08
 *
 * Componente raíz de la aplicación Chekeo V3:
 * - AuthGate con validación de sesión automática y persistencia
 * - AppShell con TopHeader, reloj operativo y barra de navegación accesible
 * - Vistas modulares por pestañas (Pedidos, Cocina, Pagos y Admin)
 */

import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { TabsContent } from '@ui/tabs';
import { useAuthStore, AuthGate } from '../features/auth';
import { AppShell, ChekeoTab } from '../components/shell';
import { OperacionView, PedidosView, CocinaView, PagosView, AdminView } from '../components/views';

export function ChekeoApp() {
  const [activeTab, setActiveTab] = useState<ChekeoTab>('operacion');
  const { isAuthenticated, status, checkSession } = useAuthStore();

  // Comprobar estado de sesión con el backend al inicializar
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Pantalla de carga inicial mientras se valida el token o sesión
  if (status === 'checking' && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tight text-text-primary">
            <span>Burgers</span>
            <span className="text-accent">.exe</span>
            <span className="ml-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-extrabold uppercase tracking-wider">
              CHEKEO V3
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-text-secondary text-sm font-semibold">
            <Loader className="w-5 h-5 animate-spin text-accent" />
            <span>Verificando sesión operativa…</span>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar pantalla de AuthGate
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  // Si está autenticado, renderizar AppShell con pestañas
  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="operacion" className="focus-visible:outline-none m-0">
        <OperacionView onTabChange={setActiveTab} />
      </TabsContent>

      <TabsContent value="pedidos" className="focus-visible:outline-none m-0">
        <PedidosView />
      </TabsContent>

      <TabsContent value="cocina" className="focus-visible:outline-none m-0">
        <CocinaView />
      </TabsContent>

      <TabsContent value="pagos" className="focus-visible:outline-none m-0">
        <PagosView />
      </TabsContent>

      <TabsContent value="admin" className="focus-visible:outline-none m-0">
        <AdminView />
      </TabsContent>
    </AppShell>
  );
}
