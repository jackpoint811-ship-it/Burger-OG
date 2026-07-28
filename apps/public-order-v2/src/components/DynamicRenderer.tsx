import React from "react";
import type { MenuCategory, MenuItem } from "@config/index";
import type { DesignSpecification, LayoutModule } from "../types/design";
import { LayoutEngine } from "./LayoutEngine";

export interface DynamicRendererProps {
  spec?: DesignSpecification | null;
  chekeoItems?: MenuItem[];
  chekeoCategories?: MenuCategory[];
  isLoading?: boolean;
  onProductSelect?: (product: MenuItem) => void;
  onAction?: (action: string) => void;
  className?: string;
}

export function DynamicRenderer({
  spec,
  chekeoItems = [],
  chekeoCategories = [],
  isLoading = false,
  onProductSelect,
  onAction,
  className = "",
}: DynamicRendererProps) {
  // Guard spec and spec.layout with Array.isArray
  const layout = Array.isArray(spec?.layout) ? spec.layout : null;

  // Filter out null, undefined, or invisible module entries before rendering
  const visibleModules = layout
    ? layout.filter(
        (module): module is LayoutModule =>
          Boolean(module) &&
          typeof module === "object" &&
          module.visible !== false
      )
    : [];

  // If no design specification or layout modules exist or none are visible
  if (!spec || !layout || visibleModules.length === 0) {
    if (isLoading) {
      return (
        <div className={`w-full space-y-6 p-4 animate-pulse motion-reduce:animate-none ${className}`}>
          <div className="h-48 bg-zinc-900/80 border border-zinc-800 rounded-2xl" />
          <div className="h-10 bg-zinc-900/80 border border-zinc-800 rounded-lg w-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-zinc-900/80 border border-zinc-800 rounded-xl" />
            <div className="h-64 bg-zinc-900/80 border border-zinc-800 rounded-xl" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-[#0d0f12] ${className}`}
      >
        <p className="text-sm font-mono text-zinc-500">
          [SYS_MSG] Especificación de diseño vacía o no provista.
        </p>
      </div>
    );
  }

  // Global Theme inline styles with defensive type guards
  const globalTheme = spec.globalTheme;
  const themeStyle: React.CSSProperties = {
    backgroundColor:
      typeof globalTheme?.backgroundColor === "string"
        ? globalTheme.backgroundColor
        : undefined,
    color:
      typeof globalTheme?.textColor === "string"
        ? globalTheme.textColor
        : undefined,
    fontFamily:
      typeof globalTheme?.fontFamily === "string"
        ? globalTheme.fontFamily
        : undefined,
  };

  return (
    <div
      className={`dynamic-renderer w-full flex flex-col space-y-6 ${className}`}
      style={themeStyle}
    >
      {visibleModules.map((module, index) => (
        <LayoutEngine
          key={module.id || `module-${index}`}
          module={module}
          globalTheme={globalTheme}
          chekeoItems={chekeoItems}
          chekeoCategories={chekeoCategories}
          isLoading={isLoading}
          onProductSelect={onProductSelect}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

