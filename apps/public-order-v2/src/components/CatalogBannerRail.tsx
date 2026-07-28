import { useState, useEffect, useRef, useCallback } from "react";
import type { CatalogBanner } from "@config/index";
import { resolveCatalogAssetUrl } from "../lib/catalog-mode";

type CatalogBannerRailProps = {
  banners: CatalogBanner[];
};

const AUTOPLAY_INTERVAL_MS = 5000;

export function CatalogBannerRail({ banners }: CatalogBannerRailProps) {
  const active = banners
    .filter((b) => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const listRef = useRef<HTMLUListElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  prefersReducedMotionRef.current = prefersReducedMotion;

  // Listen to system prefers-reduced-motion setting
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Programmatically scroll container to specific index
  const scrollToIndex = useCallback((index: number) => {
    const container = listRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    if (index >= 0 && index < children.length) {
      const target = children[index];
      const isReduced = prefersReducedMotionRef.current;
      container.scrollTo({
        left: target.offsetLeft,
        behavior: isReduced ? "auto" : "smooth",
      });
      setActiveIndex(index);
    }
  }, []);

  // Update active index based on scroll position during manual swipe
  const handleScroll = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    const scrollPos = container.scrollLeft;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, idx) => {
      const distance = Math.abs(scrollPos - child.offsetLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activeIndexRef.current) {
      setActiveIndex(closestIndex);
    }
  }, []);

  const isPaused =
    isHovered || isTouched || isFocused || prefersReducedMotion || active.length <= 1;

  // Autoplay timer effect
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % active.length;
      scrollToIndex(nextIndex);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, active.length, scrollToIndex]);

  if (!active.length) return null;

  return (
    <section
      className="catalog-banner-rail"
      aria-label="Promociones y destacados"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
      onTouchCancel={() => setIsTouched(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
    >
      <ul
        ref={listRef}
        className="catalog-banner-rail__list"
        role="list"
        onScroll={handleScroll}
      >
        {active.map((banner, index) => {
          const src = resolveCatalogAssetUrl(banner.imageUrl, banner.imageKey);
          return (
            <li
              key={banner.id}
              className="catalog-banner-card"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${active.length}`}
            >
              {src ? (
                <div className="catalog-banner-card__image" aria-hidden="true">
                  <img src={src} alt="" loading="lazy" decoding="async" />
                </div>
              ) : null}
              <div className="catalog-banner-card__body">
                <p className="catalog-banner-card__title">{banner.title}</p>
                {banner.subtitle ? (
                  <p className="catalog-banner-card__subtitle">{banner.subtitle}</p>
                ) : null}
                {banner.ctaLabel ? (
                  <span className="catalog-banner-card__cta" aria-hidden="true">
                    {banner.ctaLabel}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {active.length > 1 && (
        <div
          className="catalog-banner-rail__pagination"
          role="tablist"
          aria-label="Paginación de promociones"
        >
          {active.map((banner, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={banner.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Ver promoción ${index + 1} de ${active.length}: ${banner.title}`}
                className={`catalog-banner-rail__dot ${isActive ? "catalog-banner-rail__dot--active" : ""}`}
                onClick={() => scrollToIndex(index)}
              >
                <span className="catalog-banner-rail__dot-indicator" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
