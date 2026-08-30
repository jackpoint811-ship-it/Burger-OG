import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import type { AppEnv } from './_types';
import { authRouter } from './_routes/auth';
import { towerSchedulesRouter } from './_routes/tower-schedules';
import { campaignConfigRouter } from './_routes/campaign-config';
import { referralTicketsRouter } from './_routes/referral-tickets';
import { assetsRouter } from './_routes/assets';
import { kitchenAdminRouter } from './_routes/kitchen-admin';
import { ingredientsAdminRouter } from './_routes/ingredients-admin';
import { rafflesRouter } from './_routes/raffles';
import { rafflesAdminRouter } from './_routes/raffles-admin';
import { menuRouter } from './_routes/menu';
import { menuAdminRouter } from './_routes/menu-admin';
import { ordersRouter } from './_routes/orders';
import { ordersAdminRouter } from './_routes/orders-admin';

const app = new Hono<AppEnv>().basePath('/api');

// Global error handler
app.onError((err, c) => {
  console.error('[API Error]', err);
  return c.json(
    {
      ok: false,
      error: 'INTERNAL_ERROR',
      message: err instanceof Error ? err.message : 'Error interno del servidor'
    },
    500
  );
});

// Global 404 handler for API routes
app.notFound((c) => {
  return c.json(
    {
      ok: false,
      error: 'NOT_FOUND',
      message: `Ruta de API no encontrada: ${c.req.method} ${c.req.path}`
    },
    404
  );
});

// Mount sub-routers
app.route('/internal-v2-auth', authRouter);
app.route('/tower-schedules', towerSchedulesRouter);
app.route('/campaign-config', campaignConfigRouter);
app.route('/referral-tickets', referralTicketsRouter);
app.route('/assets-v2', assetsRouter);
app.route('/kitchen-v2-admin', kitchenAdminRouter);
app.route('/ingredients-v2-admin', ingredientsAdminRouter);
app.route('/raffles-v2', rafflesRouter);
app.route('/raffles-v2-admin', rafflesAdminRouter);
app.route('/menu-v2', menuRouter);
app.route('/menu-v2-admin', menuAdminRouter);
app.route('/orders-v2', ordersRouter);
app.route('/orders-v2-admin', ordersAdminRouter);

export const onRequest = handle(app);
export default app;
