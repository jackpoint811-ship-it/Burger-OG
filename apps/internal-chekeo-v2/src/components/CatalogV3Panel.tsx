import { useState } from 'react';
import { MenuStockTool } from './v3/MenuStockTool';
import { ComboBuilderTool } from './v3/ComboBuilderTool';
import { IngredientsMasterTool } from './v3/IngredientsMasterTool';
import { PromosManagementTool } from './v3/PromosManagementTool';
import { StoreBannersTool } from './v3/StoreBannersTool';

export type V3TabKey = 'stock' | 'combos' | 'ingredients' | 'promos' | 'store';

const NAV_TABS: Array<{ key: V3TabKey; label: string; icon: string }> = [
  { key: 'stock', label: 'Catálogo & Stock', icon: '📦' },
  { key: 'combos', label: 'Combos', icon: '🔥' },
  { key: 'ingredients', label: 'Ingredientes', icon: '🥬' },
  { key: 'promos', label: 'Ofertas Especiales', icon: '⚡' },
  { key: 'store', label: 'Tienda & Banners', icon: '🎨' },
];

export function CatalogV3Panel() {
  const [activeTab, setActiveTab] = useState<V3TabKey>('stock');

  return (
    <div className="v3-control-shell space-y-6">
      {/* ── Sub-menú de Navegación Unificado V3 ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-zinc-950 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-zinc-950 shadow-md scale-[1.02]'
                      : 'bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0 text-right">
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400/10 border border-amber-400/30 text-amber-300 px-2.5 py-1 rounded-lg">
              CONTROL V3 MODULAR
            </span>
          </div>
        </div>
      </div>

      {/* ── Contenido Modular (Switch Condicional Puro) ── */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {activeTab === 'stock' && <MenuStockTool />}
        {activeTab === 'combos' && <ComboBuilderTool />}
        {activeTab === 'ingredients' && <IngredientsMasterTool />}
        {activeTab === 'promos' && <PromosManagementTool />}
        {activeTab === 'store' && <StoreBannersTool />}
      </div>
    </div>
  );
}
