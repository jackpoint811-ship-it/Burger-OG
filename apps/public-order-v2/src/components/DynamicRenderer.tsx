import React, { useState } from "react";
import type { MenuCategory, MenuItem, CatalogBanner, MenuCategoryBanner } from "@config/index";
import type { DesignSpecification, LayoutModule } from "../types/design";
import { LayoutEngine } from "./LayoutEngine";

export interface DynamicRendererProps {
  spec?: DesignSpecification | null;
  chekeoItems?: MenuItem[];
  chekeoCategories?: MenuCategory[];
  catalogBanners?: CatalogBanner[];
  categoryBanners?: MenuCategoryBanner[];
  isLoading?: boolean;
  onProductSelect?: (product: MenuItem) => void;
  onAction?: (action: string) => void;
  className?: string;
  activeCategoryKey?: string;
  onSelectCategory?: (key: string) => void;
}

export function DynamicRenderer({
  spec,
  chekeoItems = [],
  chekeoCategories = [],
  catalogBanners = [],
  categoryBanners = [],
  isLoading = false,
  onProductSelect,
  onAction,
  className = "",
  activeCategoryKey: externalCategoryKey,
  onSelectCategory: externalSelectCategory,
}: DynamicRendererProps) {
  const [internalCategoryKey, setInternalCategoryKey] = useState<string>("all");
  const activeCategoryKey = externalCategoryKey ?? internalCategoryKey;
  const handleSelectCategory = externalSelectCategory ?? setInternalCategoryKey;

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
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            padding: "16px",
          }}
        >
          <div style={{ height: "192px", backgroundColor: "rgba(24, 24, 27, 0.8)", border: "1px solid #27272a", borderRadius: "16px" }} />
          <div style={{ height: "40px", backgroundColor: "rgba(24, 24, 27, 0.8)", border: "1px solid #27272a", borderRadius: "8px", width: "100%" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div style={{ height: "256px", backgroundColor: "rgba(24, 24, 27, 0.8)", border: "1px solid #27272a", borderRadius: "12px" }} />
            <div style={{ height: "256px", backgroundColor: "rgba(24, 24, 27, 0.8)", border: "1px solid #27272a", borderRadius: "12px" }} />
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          padding: "32px",
          textAlign: "center",
          border: "1px dashed #27272a",
          borderRadius: "16px",
          backgroundColor: "#0d0f12",
        }}
      >
        <p style={{ fontSize: "14px", fontFamily: "monospace", color: "#71717a", margin: 0 }}>
          [SYS_MSG] Especificación de diseño vacía o no provista.
        </p>
      </div>
    );
  }

  // Global Theme inline styles with defensive type guards
  const globalTheme = spec.globalTheme;
  const themeStyle: React.CSSProperties = {
    backgroundColor:
      typeof globalTheme?.backgroundColor === "string" && globalTheme.backgroundColor !== "#0B0B0B"
        ? globalTheme.backgroundColor
        : "var(--color-bg-base)",
    color:
      typeof globalTheme?.textColor === "string" && globalTheme.textColor !== "#00FF66"
        ? globalTheme.textColor
        : "var(--color-text-primary)",
    fontFamily:
      typeof globalTheme?.fontFamily === "string"
        ? globalTheme.fontFamily
        : undefined,
  };

  return (
    <div
      className="catalog-renderer-container"
      style={{
        width: "100%",
        boxSizing: "border-box",
        ...themeStyle,
      }}
    >
      {visibleModules.map((module, index) => (
        <LayoutEngine
          key={module.id || `module-${index}`}
          module={module}
          globalTheme={globalTheme}
          chekeoItems={chekeoItems}
          chekeoCategories={chekeoCategories}
          catalogBanners={catalogBanners}
          categoryBanners={categoryBanners}
          isLoading={isLoading}
          onProductSelect={onProductSelect}
          onAction={onAction}
          activeCategoryKey={activeCategoryKey}
          onSelectCategory={(key: string) => handleSelectCategory(key)}
        />
      ))}
    </div>
  );
}
