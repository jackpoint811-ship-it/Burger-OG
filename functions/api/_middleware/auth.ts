import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../_types';
import { errorResponse, requireAdminToken, requireInternalOrigin } from '../_orders-v2-utils';

export const adminAuthMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) {
    return authError;
  }
  c.set('adminAuthenticated', true);
  return next();
};

export const internalOriginMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authError = await requireInternalOrigin(c.req.raw);
  if (authError) {
    return authError;
  }
  return next();
};
