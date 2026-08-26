/**
 * AdminSearchBar.tsx — Chekeo V3
 *
 * Buscador Universal / Command Palette para el Panel de Control de Admin:
 * - Atajo de teclado global: ⌘K / Ctrl+K / /
 * - Búsqueda en tiempo real sobre todas las categorías, subcategorías y herramientas
 * - Navegación con teclado (Flechas ↑/↓, Enter, Escape)
 * - Diseño limpio, desaturado y accesible
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import type { AdminMasterCategory } from '../../features/admin/types/admin.types';
import { ADMIN_SEARCH_INDEX } from '../../features/admin/constants/admin-navigation.constants';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';

export interface AdminSearchBarProps {
  onSelect: (category: AdminMasterCategory, toolId?: string) => void;
  className?: string;
}

export function AdminSearchBar({ onSelect, className = '' }: AdminSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Atajo de teclado global (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cierre al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de resultados
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return ADMIN_SEARCH_INDEX.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.categoryLabel.toLowerCase().includes(q);
      const matchKw = item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCat || matchKw;
    }).slice(0, 6);
  }, [query]);

  // Manejo de navegación por teclado en la lista
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        onSelect(selected.category, selected.toolId);
        setIsOpen(false);
        setQuery('');
      }
    }
  };

  const handleSelectResult = (item: (typeof ADMIN_SEARCH_INDEX)[0]) => {
    onSelect(item.category, item.toolId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Campo de búsqueda */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar herramientas, platillos, torres, banners, arqueo..."
          className="w-full h-10 pl-10 pr-20 bg-surface-card border border-line rounded-2xl text-xs font-semibold text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all shadow-xs"
          aria-label="Buscar en el panel de administración"
        />

        <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="pointer-events-auto p-1 rounded-md text-text-muted hover:text-text-primary"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface-raised border border-line text-[10px] font-mono font-bold text-text-muted">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Menú de Resultados Flotante */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-surface-card border border-line rounded-2xl shadow-floating z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
          {filteredResults.length > 0 ? (
            <div className="p-2 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-muted">
                Resultados coincidentes
              </div>
              {filteredResults.map((item, index) => {
                const Icon = getAdminIcon(item.iconName);
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-surface-raised text-accent ring-1 ring-accent/30'
                        : 'text-text-primary hover:bg-surface-raised/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-text-secondary shrink-0 border border-line/60">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-raised text-text-muted border border-line/60">
                        {item.categoryLabel}
                      </span>
                      <CornerDownLeft className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-text-muted">
              No se encontraron herramientas o platillos para &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
