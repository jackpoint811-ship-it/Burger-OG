import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCatalogBanners } from '../../features';
import { useUIStore } from '../../stores';
import { resolveCatalogAssetUrl } from '@config/assets';
import type { CatalogBanner } from '@config/contracts';

export function BannerCarousel() {
  const { catalogBanners } = useCatalogBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const setActiveCategoryKey = useUIStore((s) => s.setActiveCategoryKey);

  const bannersCount = catalogBanners.length;

  // Autoplay
  useEffect(() => {
    if (bannersCount <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannersCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannersCount, isHovered]);

  if (bannersCount === 0) return null;

  const currentBanner = catalogBanners[currentIndex];
  const bannerImageUrl = currentBanner
    ? resolveCatalogAssetUrl(currentBanner.imageUrl, currentBanner.imageKey)
    : undefined;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannersCount);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannersCount) % bannersCount);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleBannerClick = (banner: CatalogBanner) => {
    if (banner.ctaActionType === 'category' && banner.ctaTarget) {
      setActiveCategoryKey(banner.ctaTarget);
      const element = document.getElementById(`category-${banner.ctaTarget.toLowerCase()}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (banner.ctaActionType === 'url' && banner.ctaTarget) {
      window.open(banner.ctaTarget, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl bg-surface border border-line shadow-card my-4"
      aria-label="Promociones y novedades"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[21/9] sm:aspect-[24/9] min-h-[140px] max-h-[220px] w-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id || currentIndex}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent cursor-pointer"
            onClick={() => handleBannerClick(currentBanner)}
          >
            {/* Background Banner Image */}
            {bannerImageUrl ? (
              <img
                src={bannerImageUrl}
                alt={currentBanner.title}
                className="absolute inset-0 w-full h-full object-cover -z-10"
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-neutral-800 to-stone-900 -z-10" />
            )}

            {/* Banner Content */}
            <div className="relative z-10 space-y-1 text-white">
              {currentBanner.badgeText && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-white text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  {currentBanner.badgeText}
                </span>
              )}
              <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                {currentBanner.title}
              </h2>
              {currentBanner.subtitle && (
                <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 max-w-md">
                  {currentBanner.subtitle}
                </p>
              )}
              {currentBanner.ctaLabel && (
                <span className="inline-block pt-1 text-xs font-bold text-accent-dark hover:underline">
                  {currentBanner.ctaLabel} →
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next Arrows (visible on hover / tablet+) */}
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

      {/* Pagination Dots */}
      {bannersCount > 1 && (
        <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full">
          {catalogBanners.map((_, idx) => (
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
    </section>
  );
}
