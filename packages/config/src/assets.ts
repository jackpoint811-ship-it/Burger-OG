const SAFE_IMAGE_KEY_PATTERN = /^[a-zA-Z0-9/_.,@-]+$/;

const isSafeSameOriginPath = (value: string) => {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.includes("\\") || value.includes("..")) return false;
  return true;
};

const isSafeHttpsImageUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};

const isSafeAssetKey = (value: string) => {
  const key = value.trim().replace(/^\/+/, "");
  if (!key || !SAFE_IMAGE_KEY_PATTERN.test(key) || key.includes("..") || key.includes("\\") || key.includes("//")) return false;
  return key.split("/").every((segment) => segment && segment !== "." && segment !== "..");
};

export const resolveCatalogAssetUrl = (imageUrl?: string, imageKey?: string): string | undefined => {
  const trimmedKey = imageKey?.trim().replace(/^\/+/, "");
  if (trimmedKey && isSafeAssetKey(trimmedKey)) {
    return `/api/assets-v2/${trimmedKey.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
  }

  const trimmedUrl = imageUrl?.trim();
  if (trimmedUrl && (isSafeSameOriginPath(trimmedUrl) || isSafeHttpsImageUrl(trimmedUrl))) return trimmedUrl;
  return undefined;
};