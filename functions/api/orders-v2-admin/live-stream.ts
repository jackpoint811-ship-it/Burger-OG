import {
  errorResponse,
  requireAdminToken,
  type AdminEnv
} from '../_orders-v2-utils';

type Env = AdminEnv;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  let lastCheckedTimestamp = new Date(Date.now() - 30000).toISOString();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('retry: 5000\n\n'));
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`));

      const poll = async () => {
        try {
          const now = new Date().toISOString();
          const newEvents = await env.BOG_MENU_DB!.prepare(
            'SELECT * FROM order_events_v2 WHERE created_at > ? ORDER BY created_at ASC LIMIT 20'
          ).bind(lastCheckedTimestamp).all();

          const events = newEvents.results ?? [];
          if (events.length > 0) {
            lastCheckedTimestamp = now;
            events.forEach((evt: any) => {
              controller.enqueue(
                encoder.encode(`event: order_event\ndata: ${JSON.stringify(evt)}\n\n`)
              );
            });
          } else {
            // Heartbeat
            controller.enqueue(encoder.encode(': ping\n\n'));
          }
        } catch {
          // Connection closed or DB error
        }
      };

      const intervalId = setInterval(poll, 4000);

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        try { controller.close(); } catch { /* ignore */ }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'GET') return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Use GET.');
  return onRequestGet(context);
};
