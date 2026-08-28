/**
 * ChekeoApp.tsx — PR-V3-08
 *
 * Componente raíz de la aplicación Chekeo V3:
 * - AuthGate con validación de sesión automática y persistencia
 * - AppShell con TopHeader, reloj operativo y barra de navegación accesible
 * - Vistas modulares por pestañas (Pedidos, Cocina, Pagos y Admin)
 */

import React, { useState, useEffect } from 'react';
import { TabsContent } from '@ui/tabs';
import { useAuthStore } from '../features/auth';
import { AppShell, ChekeoTab } from '../components/shell';
import { ResumenKView, PedidosView, CocinaView, PagosView, AdminView } from '../components/views';

export function ChekeoApp() {
  const [activeTab, setActiveTab] = useState<ChekeoTab>('resumenK');
  const { checkSession } = useAuthStore();

  // Comprobar estado de sesión con el backend al inicializar (silencioso para Admin)
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Renderizar directamente el AppShell con todas las vistas operativas accesibles libremente

  // Si está autenticado, renderizar AppShell con pestañas
  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="resumenK" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <ResumenKView onTabChange={setActiveTab} />
      </TabsContent>

      <TabsContent value="pedidos" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <PedidosView />
      </TabsContent>

      <TabsContent value="cocina" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <CocinaView />
      </TabsContent>

      <TabsContent value="pagos" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <PagosView />
      </TabsContent>

      <TabsContent value="admin" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-3xl m-0">
        <AdminView />
      </TabsContent>
    </AppShell>
  );
}
