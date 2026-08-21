import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCatalogBanners, useMenuItems } from '../../features';
import { useUIStore } from '../../stores';
import { resolveCatalogAssetUrl } from '@config/assets';
import type { CatalogBanner } from '@config/contracts';

const BANNER_BG_PRESETS: Record<string, string> = {
  'gradient-emerald': 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
  'gradient-amber': 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
  'gradient-indigo': 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
  'gradient-rose': 'linear-gradient(135deg, #BE185D 0%, #E11D48 100%)',
  'gradient-cyan': 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
  'gradient-dark': 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
};

const DEFAULT_BANNERS: CatalogBanner[] = [
  {
    id: 'default-1',
    title: '⚡ COMBOS ESPECIALES DISPONIBLES',
    subtitle: 'Burger artesanal + Papas crujientes + Bebida fría incluida.',
    ctaLabel: 'Ver Combos',
    ctaActionType: 'category',
    ctaTarget: 'combos',
    bgPreset: 'gradient-emerald',
    badgeText: 'PROMO DESTACADA',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'default-2',
    title: '🍔 PRUEBA LA LEGENDARIA OG BURGER',
    subtitle: 'Carne smash 100% Sirloin, queso manchego y aderezo de la casa.',
    ctaLabel: 'Pedir Ahora',
    ctaActionType: 'product',
    ctaTarget: 'OG',
    bgPreset: 'gradient-amber',
    badgeText: 'TOP 1 VENTAS',
    sortOrder: 2,
    isActive: true,
  },
];

export function BannerCarousel() {
  const { catalogBanners } = useCatalogBanners();
  const { items: allMenuItems } = useMenuItems();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const setActiveCategoryKey = useUIStore((s) => s.setActiveCategoryKey);
  const openProductDrawer = useUIStore((s) => s.openProductDrawer);
  const pushToast = useUIStore((s) => s.pushToast);

  const activeBanners = catalogBanners.length > 0 ? catalogBanners : DEFAULT_BANNERS;
  const bannersCount = activeBanners.length;

  // Autoplay pausado al interactuar
  useEffect(() => {
    if (bannersCount <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannersCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannersCount, isHovered]);

  if (bannersCount === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const bannerImageUrl = currentBanner
    ? resolveCatalogAssetUrl(currentBanner.imageUrl, currentBanner.imageKey)
    : undefined;

  const bgStyle = currentBanner.bgPreset
    ? BANNER_BG_PRESETS[currentBanner.bgPreset] || BANNER_BG_PRESETS['gradient-emerald']
    : 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)';

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannersCount);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannersCount) % bannersCount);
  };

  const handleBannerClick = (banner: CatalogBanner) => {
    const actionType = banner.ctaActionType?.toLowerCase() || 'category';
    const target = banner.ctaTarget?.trim() || '';

    // 1. Acción abrir producto directo
    if (actionType === 'product' && target) {
      const product = allMenuItems.find(
        (i) =>
          i.sku.toUpperCase() === target.toUpperCase() ||
          i.sku.toUpperCase().includes(target.toUpperCase())
      );
      if (product) {
        openProductDrawer(product);
        return;
      }
    }

    // 2. Acción filtrar categoría
    if ((actionType === 'category' || !actionType) && target) {
      setActiveCategoryKey(target);
      const element = document.getElementById(`category-${target.toLowerCase()}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // 3. Acción cupones / toast
    if (actionType === 'toast' || actionType === 'coupon') {
      if (target) {
        try {
          navigator.clipboard?.writeText(target);
        } catch { /* noop */ }
        pushToast(`🎟️ ¡Cupón ${target} copiado al portapapeles!`, 'success');
      }
      return;
    }

    // 4. Acción URL externa
    if (actionType === 'url' && target) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    // 5. Fallback si el target coincide con producto
    const matchedProduct = allMenuItems.find(
      (i) => i.sku.toUpperCase() === target.toUpperCase()
    );
    if (matchedProduct) {
      openProductDrawer(matchedProduct);
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl border border-line shadow-card my-4"
      aria-label="Promociones y novedades"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative min-h-[140px] max-h-[220px] w-full flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id || currentIndex}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) handleNext();
              else if (info.offset.x > 40) handlePrev();
            }}
            className="w-full min-h-[140px] flex flex-col justify-between p-4 sm:p-6 text-white cursor-pointer select-none touch-pan-y relative overflow-hidden"
            style={{ background: bgStyle }}
            onClick={() => handleBannerClick(currentBanner)}
          >
            {/* Background Image if uploaded */}
            {bannerImageUrl && (
              <img
                src={bannerImageUrl}
                alt={currentBanner.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 -z-0"
                loading="eager"
              />
            )}

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              {currentBanner.badgeText ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/35 text-white text-[10px] font-extrabold tracking-wide uppercase border border-white/20 shadow-sm backdrop-blur-xs">
                  <Sparkles className="w-3 h-3" />
                  {currentBanner.badgeText}
                </span>
              ) : <div />}
            </div>

            {/* Banner Main Content */}
            <div className="relative z-10 space-y-1 text-white my-auto">
              <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xs line-clamp-2">
                {currentBanner.title}
              </h2>
              {currentBanner.subtitle && (
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 max-w-lg leading-relaxed">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>

            {/* Bottom CTA and Dots */}
            <div className="relative z-10 flex items-center justify-between pt-2">
              {currentBanner.ctaLabel ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-black/30 hover:bg-black/40 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/25 transition-colors">
                  {currentBanner.ctaLabel} →
                </span>
              ) : <div />}

              {/* Pagination Dots */}
              {bannersCount > 1 && (
                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10">
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                      aria-label={`Ir al banner ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next Arrows */}
        {bannersCount > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-75 z-20 cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-75 z-20 cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Siguiente banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
