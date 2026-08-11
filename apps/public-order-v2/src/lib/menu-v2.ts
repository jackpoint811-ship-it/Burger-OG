import { DEFAULT_PUBLIC_CONFIG, type MenuV2Response } from '@config/index';

export async function loadMenuV2(): Promise<MenuV2Response> {
  const response = await fetch('/api/menu-v2', { cache: 'no-store', headers: { accept: 'application/json' } });
  if (!response.ok) {
    let errorMessage = `Menu endpoint returned HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && typeof errorJson === 'object' && 'error' in errorJson && typeof errorJson.error === 'string') {
        errorMessage = errorJson.error;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }
  const data = (await response.json()) as MenuV2Response;
  if (!Array.isArray(data?.items) || !Array.isArray(data?.promos) || !Array.isArray(data?.categories)) {
    throw new Error('Menu response is missing required arrays (items, promos, categories)');
  }
  return { ...data, publicConfig: data.publicConfig ?? DEFAULT_PUBLIC_CONFIG };
}
