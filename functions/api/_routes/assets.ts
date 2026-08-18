import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import { inferImageContentType, normalizeAssetKey } from '../_asset-utils';

export const assetsRouter = new Hono<AppEnv>();

const notFound = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });

assetsRouter.get('/*', async (c) => {
  const rawPath = c.req.path.replace(/^\/assets-v2\/?/, '');
  const key = normalizeAssetKey(rawPath);
  if (!key || !c.env.BOG_MENU_ASSETS) return notFound();

  const object = await c.env.BOG_MENU_ASSETS.get(key);
  if (!object) return notFound();

  const headers = new Headers();
  headers.set('content-type', object.httpMetadata?.contentType ?? inferImageContentType(key));
  headers.set('cache-control', 'public, max-age=86400, s-maxage=31536000, immutable');
  headers.set('vary', 'Accept');
  headers.set('x-content-type-options', 'nosniff');
  if (object.httpEtag) headers.set('etag', object.httpEtag);

  return new Response(object.body, { headers });
});

assetsRouter.all('/*', async () => new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } }));
