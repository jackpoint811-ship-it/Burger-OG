import { useState, useEffect } from 'react';
import {
  Package,
  Flame,
  Salad,
  Zap,
  Store,
  History,
  Trash2,
  CreditCard,
  WalletCards,
  Gift,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { AdminModuleCard } from './AdminModuleCard';

export interface AdminWorkspaceV3Props {
  onSelectModule: (moduleKey: string) => void;
  publicOrderUrl?: string;
}

interface FavoriteOption {
  id: string;
  label: string;
  icon: string;
}

const ALL_FAVORITE_CATALOG: FavoriteOption[] = [
  { id: 'v3-store:banners', label: 'Banners del Catálogo', icon: '🎨' },
  { id: 'v3-store:schedules', label: 'Horarios por Torre', icon: '⏰' },
  { id: 'v3-store:status', label: 'Estado de Tienda', icon: '🏪' },
  { id: 'v3-store:sorteos', label: 'Sorteo Promocional', icon: '🎁' },
  { id: 'v3-stock', label: 'Menú & Productos', icon: '📦' },
  { id: 'v3-combos', label: 'Combos & Paquetes', icon: '🔥' },
  { id: 'v3-ingredients', label: 'Insumos & Recetas', icon: '🥗' },
  { id: 'v3-promos', label: 'Ofertas Especiales', icon: '⚡' },
  { id: 'v3-store', label: 'Sucursal & Banners', icon: '🏬' },
  { id: 'historial', label: 'Historial Operativo', icon: '📜' },
  { id: 'basurero', label: 'Papelera de Órdenes', icon: '🗑️' },
  { id: 'cierre', label: 'Corte de Caja', icon: '💳' },
  { id: 'banco', label: 'Cuentas SPEI', icon: '🏦' },
  { id: 'sorteos', label: 'Sorteos & Promos', icon: '🎟️' },
  { id: 'reportes', label: 'Reportes CSV', icon: '📊' },
];

const DEFAULT_FAVORITES = [
  'v3-store:banners',
  'v3-store:schedules',
  'v3-stock',
  'cierre',
  'v3-store:status',
];

const STORAGE_KEY = 'chekeo_admin_favorites';

export function AdminWorkspaceV3({ onSelectModule, publicOrderUrl }: AdminWorkspaceV3Props) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* noop */
    }
    return DEFAULT_FAVORITES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* noop */
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const cards = [
    {
      id: 'v3-stock',
      title: 'Menú & Productos',
      icon: Package,
      description: 'Administración de catálogo, precios, fotografías y disponibilidad de productos en tiempo real.',
      statusLabel: 'En Vivo',
    },
    {
      id: 'v3-combos',
      title: 'Combos & Paquetes',
      icon: Flame,
      description: 'Configuración de paquetes especiales, opciones a elegir y suplementos de precio.',
      statusLabel: 'Activo',
    },
    {
      id: 'v3-ingredients',
      title: 'Insumos & Recetas',
      icon: Salad,
      description: 'Control de inventario de ingredientes cuantificables y porciones por producto.',
      statusLabel: 'Conectado',
    },
    {
      id: 'v3-promos',
      title: 'Ofertas Especiales',
      icon: Zap,
      description: 'Gestión de cupones de descuento, tarjetas promocionales y promociones activas.',
      statusLabel: 'Activo',
    },
    {
      id: 'v3-store',
      title: 'Sucursal, Banners & Horarios',
      icon: Store,
      description: 'Banners promocionales, horarios por zona o torre e interruptor general de la tienda.',
      statusLabel: 'En Vivo',
    },
    {
      id: 'historial',
      title: 'Historial Operativo',
      icon: History,
      description: 'Consulta de pedidos completados, entregados y cancelados en fechas anteriores.',
      statusLabel: 'Conectado',
    },
    {
      id: 'basurero',
      title: 'Papelera de Órdenes',
      icon: Trash2,
      description: 'Registro de órdenes eliminadas con opción de filtrado y restauración.',
      statusLabel: 'Activo',
    },
    {
      id: 'cierre',
      title: 'Corte & Cierre de Caja',
      icon: CreditCard,
      description: 'Resumen de ingresos por método de pago, desglose por rango de fechas y reporte operativo.',
      statusLabel: 'En Vivo',
    },
    {
      id: 'banco',
      title: 'Cuentas Bancarias SPEI',
      icon: WalletCards,
      description: 'Configuración de datos bancarios, número de cuenta y CLABE para transferencias.',
      statusLabel: 'Conectado',
    },
    {
      id: 'sorteos',
      title: 'Sorteos & Promociones',
      icon: Gift,
      description: 'Administración de campañas de sorteo, códigos de referidos y asignación de boletos.',
      statusLabel: 'Activo',
    },
    {
      id: 'reportes',
      title: 'Reportes & Ventas CSV',
      icon: FileText,
      description: 'Métricas consolidadas de venta, desglose por canal y exportación de datos a Excel/CSV.',
      statusLabel: 'Conectado',
    },
    {
      id: 'public-store',
      title: 'Ver Tienda Pública',
      icon: ExternalLink,
      description: 'Vista previa directa de la tienda pública para validar cambios en tiempo real.',
      statusLabel: 'En Línea',
      isExternal: true,
    },
  ];

  const handleCardClick = (card: typeof cards[number]) => {
    if (card.isExternal) {
      if (publicOrderUrl) {
        window.open(publicOrderUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open('https://burgers-exe.pages.dev', '_blank', 'noopener,noreferrer');
      }
    } else {
      onSelectModule(card.id);
    }
  };

  const favoriteItemsToRender = favorites
    .map((favId) => ALL_FAVORITE_CATALOG.find((item) => item.id === favId))
    .filter((item): item is FavoriteOption => item !== undefined);

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto px-4 py-2">
      {/* Header del Hub */}
      <div className="flex flex-col items-center justify-center text-center gap-3 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto">
        <span className="px-3.5 py-1.5 text-xs font-extrabold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Operación Activa
        </span>
        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Centro de Control Administrativo
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          Selecciona un módulo táctil o usa tus accesos rápidos para gestionar la operación.
        </p>
      </div>

      {/* ── Sección de Favoritos / Accesos Rápidos ── */}
      {favoriteItemsToRender.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>⭐</span> Accesos Rápidos (Favoritos)
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              Haz clic en ★ en cualquier tarjeta para agregarla
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {favoriteItemsToRender.map((fav) => (
              <button
                key={fav.id}
                type="button"
                onClick={() => onSelectModule(fav.id)}
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 hover:bg-amber-500/10 transition-all text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0 shadow-xs active:scale-95"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">{fav.icon}</span>
                <span>{fav.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cuadrícula Táctil Modular (Grid Autoadaptable 12 Módulos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <AdminModuleCard
            key={card.id}
            id={card.id}
            title={card.title}
            icon={card.icon}
            description={card.description}
            statusLabel={card.statusLabel}
            onClick={() => handleCardClick(card)}
            isExternal={card.isExternal}
            isFavorite={favorites.includes(card.id)}
            onToggleFavorite={!card.isExternal ? () => toggleFavorite(card.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
