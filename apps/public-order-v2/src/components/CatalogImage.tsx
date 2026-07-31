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
        <div className="catalog-image-fallback-icon" aria-hidden="true">
          <span style={{ fontSize: "2rem", opacity: 0.5 }}>🍔</span>
        </div>
      )}
    </div>
  );
}
