/**
 * AdminSearchBar.tsx — Chekeo V3
 *
 * Buscador Universal / Command Palette para el Panel de Control de Admin:
 * - Estado colapsado: Botón compacto con icono de lupa (Search).
 * - Estado expandido: Overlay de pantalla completa con Command Palette centrado.
 * - Atajos de teclado: ⌘K / Ctrl+K para abrir, Escape para cerrar, Flechas ↑/↓ + Enter para navegar.
 * - Filtrado en tiempo real sobre ADMIN_SEARCH_INDEX por título, descripción y palabras clave.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import type { AdminMasterCategory, AdminSearchItem } from '../../features/admin/types/admin.types';
import { ADMIN_SEARCH_INDEX } from '../../features/admin/constants/admin-navigation.constants';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';

export interface AdminSearchBarProps {
  onSelect: (category: AdminMasterCategory, toolId?: string) => void;
  className?: string;
}

export function AdminSearchBar({ onSelect, className = '' }: AdminSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Atajo global ⌘K / Ctrl+K para abrir/cerrar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Enfocar input al abrir y resetear query al cerrar
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Filtrado de resultados
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return ADMIN_SEARCH_INDEX.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCat = item.categoryLabel?.toLowerCase().includes(q);
      const matchKw = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCat || matchKw;
    });
  }, [query]);

  const handleSelect = (item: AdminSearchItem) => {
    onSelect(item.category, item.toolId);
    setIsOpen(false);
    setQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  return (
    <>
      {/* Botón Colapsado */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-9 h-9 flex items-center justify-center rounded-xl bg-surface-raised border border-line hover:border-accent/40 text-text-secondary hover:text-text-primary transition-all duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${className}`}
        aria-label="Abrir buscador"
        title="Buscar (⌘K)"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Overlay Expandido */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Buscador del panel de administración"
        >
          <div
            ref={cardRef}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-3 max-w-lg w-full bg-surface-card rounded-2xl border border-line shadow-floating overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          >
            {/* Barra de entrada de búsqueda */}
            <div className="flex items-center gap-2 p-3 border-b border-line">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0 cursor-pointer"
                aria-label="Cerrar búsqueda"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-text-muted absolute left-2 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Buscar herramientas, platillos, torres, banners..."
                  className="w-full h-10 pl-8 pr-8 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
                  aria-label="Buscar en el panel de administración"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="absolute right-1 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de resultados */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {query.trim().length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  Escribe para buscar herramientas, platillos, torres, sorteos, insumos o corte Z...
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((item, index) => {
                  const Icon = getAdminIcon(item.iconName);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? 'bg-surface-raised text-accent ring-1 ring-accent/30'
                          : 'text-text-primary hover:bg-surface-raised/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-text-secondary shrink-0 border border-line/60">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-text-secondary truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-text-muted font-medium px-2 py-0.5 rounded-md bg-surface-raised border border-line/60">
                          {item.categoryLabel}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-text-muted">
                  No se encontraron herramientas o platillos para &ldquo;{query}&rdquo;
                </div>
              )}
            </div>

            {/* Pie con atajos de teclado */}
            <div className="px-4 py-2 bg-surface-raised/40 border-t border-line flex items-center justify-between text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-line text-[10px] font-mono font-bold">↑↓</kbd> Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-line text-[10px] font-mono font-bold">↵</kbd> Seleccionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-line text-[10px] font-mono font-bold">ESC</kbd> Cerrar
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
