import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import {
  buildExpiredInternalSessionCookie,
  buildInternalSessionCookie,
  createInternalSessionValue,
  errorResponse,
  hasInternalAuthSecret,
  hasValidInternalSession,
  json,
  parseJsonObject
} from '../_orders-v2-utils';

export const authRouter = new Hono<AppEnv>();

const safeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
};

authRouter.post('/login', async (c) => {
  const expectedPin = c.env.BOG_INTERNAL_PIN?.trim() || '';
  if (!expectedPin) return errorResponse(503, 'AUTH_NOT_CONFIGURED', 'Internal auth is not configured.');

  const body = await parseJsonObject(c.req.raw);
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
  if (!pin || !safeEqual(pin, expectedPin)) return errorResponse(401, 'INVALID_PIN', 'PIN inválido.');

  const sessionValue = await createInternalSessionValue(c.env);
  if (!sessionValue) return errorResponse(503, 'AUTH_NOT_CONFIGURED', 'Internal auth is not configured.');

  const response = json(200, { ok: true, data: { authenticated: true } });
  response.headers.append('Set-Cookie', buildInternalSessionCookie(c.req.raw, sessionValue));
  return response;
});

authRouter.post('/logout', async (c) => {
  const response = json(200, { ok: true });
  response.headers.append('Set-Cookie', buildExpiredInternalSessionCookie(c.req.raw));
  return response;
});

authRouter.get('/status', async (c) => {
  if (!hasInternalAuthSecret(c.env)) return errorResponse(503, 'AUTH_NOT_CONFIGURED', 'Internal auth is not configured.');
  const authenticated = await hasValidInternalSession(c.req.raw, c.env);
  return json(200, { ok: true, data: { authenticated } });
});
