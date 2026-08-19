import React, { useRef, useEffect } from 'react';
import { useCategories } from '../../features';
import { useUIStore } from '../../stores';

export function CategoryNav() {
  const { categories, isLoading } = useCategories();
  const activeCategoryKey = useUIStore((s) => s.activeCategoryKey);
  const setActiveCategoryKey = useUIStore((s) => s.setActiveCategoryKey);
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Default active category to first one if none selected
  useEffect(() => {
    if (!activeCategoryKey && categories.length > 0) {
      setActiveCategoryKey(categories[0].key);
    }
  }, [activeCategoryKey, categories, setActiveCategoryKey]);

  // Scroll active tab into view horizontally
  useEffect(() => {
    if (!activeCategoryKey) return;
    const btn = buttonRefs.current[activeCategoryKey.toLowerCase()];
    if (btn && navRef.current) {
      const nav = navRef.current;
      const navRect = nav.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const offset = btnRect.left - navRect.left - navRect.width / 2 + btnRect.width / 2;
      nav.scrollTo({
        left: nav.scrollLeft + offset,
        behavior: 'smooth',
      });
    }
  }, [activeCategoryKey]);

  const handleCategoryClick = (categoryKey: string) => {
    setActiveCategoryKey(categoryKey);
    const element = document.getElementById(`category-${categoryKey.toLowerCase()}`);
    if (element) {
      // Offset for sticky header
      const yOffset = -70;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="sticky top-0 z-30 w-full bg-surface-card/95 backdrop-blur-md border-b border-line py-2.5 px-4 shadow-xs">
        <div className="max-w-[768px] mx-auto flex items-center gap-2 overflow-x-hidden">
          <div className="h-9 w-24 rounded-full bg-surface animate-pulse shrink-0" />
          <div className="h-9 w-28 rounded-full bg-surface animate-pulse shrink-0" />
          <div className="h-9 w-20 rounded-full bg-surface animate-pulse shrink-0" />
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <nav
      className="sticky top-0 z-30 w-full bg-surface-card/95 backdrop-blur-md border-b border-line shadow-xs"
      aria-label="Navegación por categorías del menú"
    >
      <div className="max-w-[768px] mx-auto px-4">
        <div
          ref={navRef}
          className="flex items-center gap-2 py-2.5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {categories.map((cat) => {
            const isSelected =
              activeCategoryKey?.toLowerCase() === cat.key.toLowerCase() ||
              (!activeCategoryKey && cat === categories[0]);

            return (
              <button
                key={cat.id || cat.key}
                ref={(el) => {
                  buttonRefs.current[cat.key.toLowerCase()] = el;
                }}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] shrink-0 select-none ${
                  isSelected
                    ? 'bg-accent text-white shadow-sm ring-2 ring-accent/20'
                    : 'bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary border border-line'
                }`}
                aria-current={isSelected ? 'true' : undefined}
              >
                {cat.emoji && <span className="text-sm">{cat.emoji}</span>}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
