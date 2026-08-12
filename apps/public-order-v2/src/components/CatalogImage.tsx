import { useState, type CSSProperties } from "react";
import type { CatalogProductType } from "../lib/catalog-mode";

export interface CatalogImageProps {
  src?: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallbackType?: CatalogProductType;
  fallbackSvg?: React.ReactNode;
  loading?: "lazy" | "eager";
}

export function getCategoryEmojiForFallback(type?: string, altText?: string): string {
  const seed = `${type ?? ""} ${altText ?? ""}`.toLowerCase();
  if (seed.includes("combo") || type === "combo") return "💥";
  if (seed.includes("bebida") || seed.includes("drink") || seed.includes("refresco") || seed.includes("agua") || type === "drink") return "🥤";
  if (seed.includes("papas") || seed.includes("aros") || seed.includes("side") || seed.includes("garnish") || seed.includes("entrada") || type === "side" || type === "garnish") return "🍟";
  if (seed.includes("postre") || seed.includes("helado") || seed.includes("shake") || seed.includes("malteada") || type === "dessert") return "🍨";
  if (seed.includes("extra") || seed.includes("upgrade") || seed.includes("queso") || seed.includes("tocino") || type === "extra" || type === "topping") return "⚡";
  if (seed.includes("promo") || seed.includes("flash") || type === "promo") return "🔥";
  if (seed.includes("sorteo") || seed.includes("boleto") || seed.includes("raffle") || type === "raffle") return "🎁";
  return "🍔";
}

export function CatalogImage({
  src,
  alt,
  className = "",
  style,
  fallbackType = "burger",
  fallbackSvg,
  loading = "lazy",
}: CatalogImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const containerStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    ...style,
  };

  const showImage = Boolean(src) && !hasError;
  const categoryEmoji = getCategoryEmojiForFallback(fallbackType, alt);

  return (
    <div className={`catalog-image-wrapper ${className}`} style={containerStyle}>
      {/* Shimmer Skeleton placeholder */}
      {showImage && !isLoaded && (
        <div className="catalog-image-skeleton" aria-hidden="true" />
      )}

      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "opacity",
          }}
        />
      ) : fallbackSvg ? (
        fallbackSvg
      ) : (
        <div className="catalog-image-fallback-icon" aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "var(--color-surface-alt, #f3f4f6)", borderRadius: "inherit" }}>
          <span style={{ fontSize: "2.4rem", userSelect: "none" }}>{categoryEmoji}</span>
        </div>
      )}
    </div>
  );
}
