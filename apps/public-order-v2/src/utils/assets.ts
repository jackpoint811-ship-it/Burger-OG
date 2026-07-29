import type { SyntheticEvent } from "react";

/**
 * Returns full asset URL using Cloudflare asset base URL configuration.
 * Handles empty string, absolute http/https/data URLs, leading slashes, and pre-prefixed URLs.
 */
export function getCloudflareAssetUrl(id: string): string {
  if (!id) return "";

  // If already absolute URL or data URI
  if (
    id.startsWith("http://") ||
    id.startsWith("https://") ||
    id.startsWith("data:")
  ) {
    return id;
  }

  const envBase =
    (import.meta.env?.VITE_CLOUDFLARE_ASSET_BASE_URL as string | undefined) ||
    "/api/assets-v2/";
  const baseUrl = envBase.endsWith("/") ? envBase : `${envBase}/`;

  if (id.startsWith(baseUrl)) return id;
  if (id.startsWith("/api/assets-v2/")) return id;

  const cleanId = id.startsWith("/") ? id.slice(1) : id;
  return `${baseUrl}${cleanId}`;
}

/**
 * Generates a Premium Casual SVG data URI placeholder when asset images fail to load or are missing.
 */
export function getCasualSvgPlaceholder(typeOrName?: string): string {
  const rawType = (typeOrName || "burger").toLowerCase();
  let label = "Burgers.exe";
  let iconSvg = "";

  if (rawType.includes("drink") || rawType.includes("bebida")) {
    label = "Bebida";
    iconSvg = `<path d="M6 3h12l-1.5 17h-9L6 3z" stroke="#16A34A" stroke-width="2" fill="none"/><path d="M12 3V-2" stroke="#16A34A" stroke-width="2"/>`;
  } else if (rawType.includes("combo")) {
    label = "Combo";
    iconSvg = `<rect x="3" y="11" width="18" height="9" rx="2" stroke="#16A34A" stroke-width="2" fill="none"/><path d="M6 11C6 7 18 7 18 11" stroke="#16A34A" stroke-width="2" fill="none"/><line x1="3" y1="16" x2="21" y2="16" stroke="#16A34A" stroke-width="1.5"/>`;
  } else if (
    rawType.includes("side") ||
    rawType.includes("guarnicion") ||
    rawType.includes("extra")
  ) {
    label = "Extra";
    iconSvg = `<path d="M5 9l2 11h10l2-11H5z" stroke="#16A34A" stroke-width="2" fill="none"/><path d="M8 9V4M12 9V2M16 9V4" stroke="#16A34A" stroke-width="2"/>`;
  } else if (rawType.includes("topping")) {
    label = "Topping";
    iconSvg = `<circle cx="12" cy="12" r="7" stroke="#16A34A" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="#16A34A" stroke-width="1.5" fill="none"/>`;
  } else {
    label =
      rawType.length > 16
        ? rawType.substring(0, 16)
        : rawType.charAt(0).toUpperCase() + rawType.slice(1);
    iconSvg = `<rect x="3" y="11" width="18" height="8" rx="2" stroke="#16A34A" stroke-width="2" fill="none"/><path d="M5 11C5 7 19 7 19 11" stroke="#16A34A" stroke-width="2" fill="none"/><line x1="3" y1="19" x2="21" y2="19" stroke="#16A34A" stroke-width="2"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#F5F2EE"/>
  <rect x="12" y="12" width="376" height="276" rx="16" fill="none" stroke="#16A34A" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.15"/>
  <g transform="translate(188, 105) scale(2.2)">
    ${iconSvg}
  </g>
  <text x="200" y="210" text-anchor="middle" fill="#16A34A" font-family="'Inter', sans-serif" font-size="16" font-weight="800">
    ${label}
  </text>
  <text x="200" y="235" text-anchor="middle" fill="#16A34A" font-family="'Inter', sans-serif" font-size="12" opacity="0.6">
    Imagen no disponible
  </text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Image error handler that replaces a broken image source with a casual SVG placeholder.
 */
export function handleAssetImageError(
  e: SyntheticEvent<HTMLImageElement, Event>,
  typeOrName?: string
): void {
  const target = e.currentTarget;
  const placeholder = getCasualSvgPlaceholder(typeOrName);
  if (target.src !== placeholder) {
    target.onerror = null;
    target.src = placeholder;
  }
}
