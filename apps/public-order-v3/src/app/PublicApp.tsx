import React from 'react';
import {
  useMenuQuery,
  useCategories,
  useFeaturedItems,
  useActiveTowers,
  useActiveRaffleQuery,
} from '../features';
import { useCartStore, selectCartCount, selectCartTotal } from '../stores';

export function PublicApp() {
  const { isLoading: isMenuLoading, isError: isMenuError } = useMenuQuery();
  const { categories } = useCategories();
  const { featuredItems } = useFeaturedItems();
  const { towers } = useActiveTowers();
  const { data: activeRaffle } = useActiveRaffleQuery();
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-surface-card rounded-2xl p-6 shadow-panel border border-line space-y-4 text-center">
        <div>
          <span className="inline-block text-4xl mb-2">🍔</span>
          <h1 className="text-2xl font-bold text-text-primary">
            Burgers.exe V3 — Public Order
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            TanStack Query v5 + Zustand v5 + Tailwind CSS v4
          </p>
        </div>

        {/* Feature Status Grid */}
        <div className="grid grid-cols-2 gap-3 text-left pt-2">
          <div className="p-3 rounded-xl bg-bg-base border border-line">
            <span className="text-xs text-text-muted font-medium">Catálogo / Menú</span>
            <div className="text-sm font-semibold text-text-primary mt-0.5">
              {isMenuLoading ? (
                <span className="text-text-muted animate-pulse">Cargando...</span>
              ) : isMenuError ? (
                <span className="text-red-500">Error</span>
              ) : (
                <span>{categories.length} Categorías · {featuredItems.length} Destacados</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-bg-base border border-line">
            <span className="text-xs text-text-muted font-medium">Torres de Entrega</span>
            <div className="text-sm font-semibold text-text-primary mt-0.5">
              {towers.length > 0 ? `${towers.length} Torres Activas` : 'Consultando...'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-bg-base border border-line">
            <span className="text-xs text-text-muted font-medium">Sorteo / Campaña</span>
            <div className="text-sm font-semibold text-text-primary mt-0.5 truncate">
              {activeRaffle ? activeRaffle.title : 'Sin sorteo activo'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-bg-base border border-line">
            <span className="text-xs text-text-muted font-medium">Carrito (Zustand)</span>
            <div className="text-sm font-semibold text-text-primary mt-0.5">
              {cartCount} items · ${cartTotal} MXN
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          PR-V3-05: Features & Query Hooks Conectados
        </div>
      </div>
    </div>
  );
}
