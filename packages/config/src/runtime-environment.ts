import type { OrderV2Environment } from "./contracts";

export type ChekeoRuntimeEnvironment = "local" | "preview" | "production";

export const PUBLIC_PRODUCTION_ORDER_URL = "https://burgers-exe.pages.dev/";
export const PUBLIC_PREVIEW_ORDER_URL =
  "https://burgers-exe-public-v2-preview.pages.dev/";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const normalizeHostname = (hostname: string) =>
  hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");

export const isLocalRuntimeHostname = (hostname: string) => {
  const normalized = normalizeHostname(hostname);
  return LOCAL_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost");
};

export const isPreviewRuntimeHostname = (hostname: string) => {
  const normalized = normalizeHostname(hostname);
  return (
    normalized.includes("internal-v2-preview") ||
    normalized.includes("public-v2-preview") ||
    normalized.includes("preview") ||
    normalized.includes("staging")
  );
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD según la zona horaria canónica de Ciudad de México (America/Mexico_City).
 * Es segura y consistente en navegadores, Cloudflare Workers y scripts de Node.js.
 */
export function getCdmxTodayString(now: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Formatea cualquier Date o timestamp ISO en fecha YYYY-MM-DD en zona horaria CDMX.
 */
export function formatCdmxDateString(dateOrIso: Date | string): string {
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return getCdmxTodayString();
  return getCdmxTodayString(d);
}

export const getChekeoRuntimeEnvironment = (
  hostname =
    typeof window === "undefined" ? "" : window.location.hostname,
): ChekeoRuntimeEnvironment => {
  if (isLocalRuntimeHostname(hostname)) return "local";
  if (isPreviewRuntimeHostname(hostname)) return "preview";
  return "production";
};

export const getOrderEnvironmentForChekeoRuntime = (
  environment: ChekeoRuntimeEnvironment,
): OrderV2Environment => (environment === "production" ? "production" : "preview");

export const getPublicOrderUrlForEnvironment = (
  environment: ChekeoRuntimeEnvironment,
) =>
  environment === "production"
    ? PUBLIC_PRODUCTION_ORDER_URL
    : PUBLIC_PREVIEW_ORDER_URL;

export const getPublicOrderLabelForEnvironment = (
  environment: ChekeoRuntimeEnvironment,
) =>
  environment === "production"
    ? "Ver Burgers.exe Producción"
    : "Ver Burgers.exe Preview";

export const getPublicOrderEnvironment = (
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
  search = typeof window === "undefined" ? "" : window.location.search,
): OrderV2Environment => {
  const params = new URLSearchParams(search);
  const raw =
    params.get("environment") ??
    params.get("env") ??
    params.get("preview") ??
    "";
  const normalized = raw.trim().toLowerCase();

  if (normalized === "preview" || raw === "1") return "preview";
  if (normalized === "production" || normalized === "prod") return "production";
  return isPreviewRuntimeHostname(hostname) ? "preview" : "production";
};
