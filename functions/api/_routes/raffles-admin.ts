import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import type {
  CreateRaffleReferralCodePayload,
  CreateRaffleTicketAdjustmentPayload,
  RaffleCampaignsAdminResponse,
  RaffleReferralCodeMutationResponse,
  RaffleReferralCodesAdminResponse,
  RaffleReferralMutationResponse,
  RaffleReferralsAdminResponse,
  RaffleSummaryResponse,
  RaffleTicketAdjustmentMutationResponse,
  UpdateRaffleReferralCodePayload,
  UpdateRaffleReferralPayload,
  UpdateRaffleTicketAdjustmentPayload
} from '../../../packages/config/src';
import {
  buildReferralCodeText,
  calculateSummary,
  createCampaign,
  errorResponse,
  generateId,
  getCampaignForSummary,
  json,
  mapCampaign,
  mapReferral,
  mapReferralCode,
  mapTicketAdjustment,
  normalizePhone,
  readJsonPayload,
  REFERRAL_BURGER_WORDS,
  REFERRAL_STATUSES,
  requireRaffleAdmin,
  softDeleteCampaign,
  updateCampaign,
  validateCreatePayload,
  validateUpdatePayload,
  type RaffleCampaignRow,
  type RaffleTicketAdjustmentRow,
  type ReferralCodeRow,
  type ReferralRow
} from '../_raffles-utils';
import { deleteRaffleImage, uploadRaffleImage } from '../_raffles-image-utils';

export const rafflesAdminRouter = new Hono<AppEnv>();

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

// GET /api/raffles-v2-admin/campaigns
rafflesAdminRouter.get('/campaigns', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;

  try {
    const result = await c.env.BOG_MENU_DB!.prepare(
      'SELECT * FROM raffle_campaigns_v2 WHERE deleted_at IS NULL ORDER BY is_active DESC, created_at DESC'
    ).all<RaffleCampaignRow>();
    const payload: RaffleCampaignsAdminResponse = {
      ok: true,
      data: { campaigns: (result.results ?? []).map(mapCampaign) }
    };
    return json(200, payload);
  } catch {
    return errorResponse(500, 'RAFFLES_LIST_FAILED', 'No se pudieron cargar los sorteos.');
  }
});

// POST /api/raffles-v2-admin/campaigns
rafflesAdminRouter.post('/campaigns', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = validateCreatePayload(body);
  if (payload instanceof Response) return payload;

  try {
    const campaign = await createCampaign(c.env.BOG_MENU_DB!, payload);
    return json(201, { ok: true, data: { campaign } });
  } catch {
    return errorResponse(500, 'RAFFLES_CREATE_FAILED', 'No se pudo crear el sorteo.');
  }
});

// PATCH /api/raffles-v2-admin/campaigns/:id
rafflesAdminRouter.patch('/campaigns/:id', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ID', 'Id inválido.');
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = validateUpdatePayload(body);
  if (payload instanceof Response) return payload;

  try {
    const campaign = await updateCampaign(c.env.BOG_MENU_DB!, id, payload);
    if (!campaign) return errorResponse(404, 'RAFFLE_NOT_FOUND', 'Sorteo no encontrado.');
    return json(200, { ok: true, data: { campaign } });
  } catch {
    return errorResponse(500, 'RAFFLES_UPDATE_FAILED', 'No se pudo actualizar el sorteo.');
  }
});

// DELETE /api/raffles-v2-admin/campaigns/:id
rafflesAdminRouter.delete('/campaigns/:id', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ID', 'Id inválido.');

  try {
    const campaign = await softDeleteCampaign(c.env.BOG_MENU_DB!, id);
    if (!campaign) return errorResponse(404, 'RAFFLE_NOT_FOUND', 'Sorteo no encontrado.');
    return json(200, { ok: true, data: { campaign } });
  } catch {
    return errorResponse(500, 'RAFFLES_DELETE_FAILED', 'No se pudo ocultar el sorteo.');
  }
});

// POST /api/raffles-v2-admin/campaigns/:id/banner-image
rafflesAdminRouter.post('/campaigns/:id/banner-image', async (c) => {
  return uploadRaffleImage('banner', {
    env: c.env,
    params: { id: c.req.param('id') },
    request: c.req.raw,
    functionPath: c.req.path,
    waitUntil: (p: Promise<any>) => c.executionCtx?.waitUntil(p),
    passThroughOnException: () => c.executionCtx?.passThroughOnException(),
    next: async () => new Response(null),
    data: {}
  } as any);
});

// DELETE /api/raffles-v2-admin/campaigns/:id/banner-image
rafflesAdminRouter.delete('/campaigns/:id/banner-image', async (c) => {
  return deleteRaffleImage('banner', {
    env: c.env,
    params: { id: c.req.param('id') },
    request: c.req.raw,
    functionPath: c.req.path,
    waitUntil: (p: Promise<any>) => c.executionCtx?.waitUntil(p),
    passThroughOnException: () => c.executionCtx?.passThroughOnException(),
    next: async () => new Response(null),
    data: {}
  } as any);
});

// POST /api/raffles-v2-admin/campaigns/:id/detail-image
rafflesAdminRouter.post('/campaigns/:id/detail-image', async (c) => {
  return uploadRaffleImage('detail', {
    env: c.env,
    params: { id: c.req.param('id') },
    request: c.req.raw,
    functionPath: c.req.path,
    waitUntil: (p: Promise<any>) => c.executionCtx?.waitUntil(p),
    passThroughOnException: () => c.executionCtx?.passThroughOnException(),
    next: async () => new Response(null),
    data: {}
  } as any);
});

// DELETE /api/raffles-v2-admin/campaigns/:id/detail-image
rafflesAdminRouter.delete('/campaigns/:id/detail-image', async (c) => {
  return deleteRaffleImage('detail', {
    env: c.env,
    params: { id: c.req.param('id') },
    request: c.req.raw,
    functionPath: c.req.path,
    waitUntil: (p: Promise<any>) => c.executionCtx?.waitUntil(p),
    passThroughOnException: () => c.executionCtx?.passThroughOnException(),
    next: async () => new Response(null),
    data: {}
  } as any);
});

// GET /api/raffles-v2-admin/referral-codes
rafflesAdminRouter.get('/referral-codes', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const campaignId = normalizeText(c.req.query('campaignId'));
  const q = normalizeText(c.req.query('q'));
  if (!campaignId) return errorResponse(400, 'CAMPAIGN_REQUIRED', 'campaignId es requerido.');

  try {
    const conditions = ['campaign_id = ?'];
    const bindings: string[] = [campaignId];
    if (q) {
      const normalizedPhone = normalizePhone(q);
      conditions.push('(UPPER(owner_name) LIKE ? OR code LIKE ? OR owner_phone LIKE ?)');
      bindings.push(`%${q.toUpperCase()}%`, `%${q.toUpperCase()}%`, `%${normalizedPhone || q}%`);
    }
    const result = await c.env.BOG_MENU_DB!.prepare(
      `SELECT * FROM raffle_referral_codes_v2 WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`
    )
      .bind(...bindings)
      .all<ReferralCodeRow>();
    const payload: RaffleReferralCodesAdminResponse = { ok: true, data: { codes: (result.results ?? []).map(mapReferralCode) } };
    return json(200, payload);
  } catch {
    return errorResponse(500, 'REFERRAL_CODES_LIST_FAILED', 'No se pudieron cargar códigos de invitado.');
  }
});

// POST /api/raffles-v2-admin/referral-codes
rafflesAdminRouter.post('/referral-codes', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = body as Partial<CreateRaffleReferralCodePayload>;
  const campaignId = normalizeText(payload.campaignId);
  const ownerName = normalizeText(payload.ownerName);
  const ownerPhone = normalizePhone(payload.ownerPhone);
  const burgerWord = normalizeText(payload.burgerWord).toUpperCase();
  const number = Number(payload.number);
  if (!campaignId) return errorResponse(400, 'CAMPAIGN_REQUIRED', 'campaignId es requerido.');
  if (ownerName.length < 2 || ownerName.length > 80) return errorResponse(400, 'INVALID_OWNER_NAME', 'El nombre debe tener entre 2 y 80 caracteres.');
  if (ownerPhone.length < 10) return errorResponse(400, 'INVALID_OWNER_PHONE', 'Teléfono de participante requerido.');
  if (!REFERRAL_BURGER_WORDS.includes(burgerWord as (typeof REFERRAL_BURGER_WORDS)[number])) return errorResponse(400, 'INVALID_BURGER_WORD', 'Palabra burger inválida.');
  if (!Number.isInteger(number) || number < 1 || number > 100) return errorResponse(400, 'INVALID_NUMBER', 'El número debe ser entero entre 1 y 100.');
  const code = buildReferralCodeText(ownerName, burgerWord, number);
  if (!code || code.length > 32) return errorResponse(400, 'INVALID_CODE', 'No se pudo generar un código válido.');

  try {
    const campaign = await getCampaignForSummary(c.env.BOG_MENU_DB!, campaignId);
    if (!campaign) return errorResponse(404, 'RAFFLE_NOT_FOUND', 'Sorteo no encontrado.');
    const existingOwner = await c.env.BOG_MENU_DB!.prepare('SELECT * FROM raffle_referral_codes_v2 WHERE campaign_id = ? AND owner_phone = ? LIMIT 1')
      .bind(campaignId, ownerPhone)
      .first<ReferralCodeRow>();
    if (existingOwner) {
      const response: RaffleReferralCodeMutationResponse = { ok: true, data: { code: mapReferralCode(existingOwner) } };
      return json(200, response);
    }
    const existingCode = await c.env.BOG_MENU_DB!.prepare('SELECT id FROM raffle_referral_codes_v2 WHERE campaign_id = ? AND code = ? LIMIT 1')
      .bind(campaignId, code)
      .first<{ id: string }>();
    if (existingCode) return errorResponse(409, 'REFERRAL_CODE_CONFLICT', 'Ese código ya existe para el sorteo. Cambia el número.');
    const id = generateId('refcode');
    const now = new Date().toISOString();
    await c.env.BOG_MENU_DB!.prepare(
      `INSERT INTO raffle_referral_codes_v2 (id, campaign_id, owner_phone, owner_name, code, label_text, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, 1, ?, ?)`
    )
      .bind(id, campaignId, ownerPhone, ownerName, code, now, now)
      .run();
    const row = await c.env.BOG_MENU_DB!.prepare('SELECT * FROM raffle_referral_codes_v2 WHERE id = ? LIMIT 1').bind(id).first<ReferralCodeRow>();
    if (!row) throw new Error('Missing inserted referral code');
    const response: RaffleReferralCodeMutationResponse = { ok: true, data: { code: mapReferralCode(row) } };
    return json(201, response);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) return errorResponse(409, 'REFERRAL_CODE_CONFLICT', 'Ya existe un código para ese participante o código.');
    return errorResponse(500, 'REFERRAL_CODES_CREATE_FAILED', 'No se pudo crear el código de invitado.');
  }
});

// PATCH /api/raffles-v2-admin/referral-codes/:id
rafflesAdminRouter.patch('/referral-codes/:id', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ID', 'Id inválido.');
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = body as UpdateRaffleReferralCodePayload;
  const assignments: string[] = [];
  const bindings: Array<string | number | null> = [];
  if ('isActive' in payload) {
    assignments.push('is_active = ?');
    bindings.push(payload.isActive ? 1 : 0);
  }
  if ('labelText' in payload) {
    const label = normalizeText(payload.labelText);
    if (label.length > 160) return errorResponse(400, 'INVALID_LABEL', 'labelText excede el máximo.');
    assignments.push('label_text = ?');
    bindings.push(label || null);
  }
  if ('ownerName' in payload) {
    const ownerName = normalizeText(payload.ownerName);
    if (ownerName.length < 2 || ownerName.length > 80) return errorResponse(400, 'INVALID_OWNER_NAME', 'El nombre debe tener entre 2 y 80 caracteres.');
    assignments.push('owner_name = ?');
    bindings.push(ownerName);
  }
  if (!assignments.length) return errorResponse(400, 'EMPTY_PATCH', 'No hay cambios permitidos.');
  assignments.push('updated_at = ?');
  bindings.push(new Date().toISOString());
  try {
    await c.env.BOG_MENU_DB!.prepare(`UPDATE raffle_referral_codes_v2 SET ${assignments.join(', ')} WHERE id = ?`).bind(...bindings, id).run();
    const row = await c.env.BOG_MENU_DB!.prepare('SELECT * FROM raffle_referral_codes_v2 WHERE id = ? LIMIT 1').bind(id).first<ReferralCodeRow>();
    if (!row) return errorResponse(404, 'REFERRAL_CODE_NOT_FOUND', 'Código no encontrado.');
    const response: RaffleReferralCodeMutationResponse = { ok: true, data: { code: mapReferralCode(row) } };
    return json(200, response);
  } catch {
    return errorResponse(500, 'REFERRAL_CODES_UPDATE_FAILED', 'No se pudo actualizar el código.');
  }
});

// GET /api/raffles-v2-admin/referrals
rafflesAdminRouter.get('/referrals', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const campaignId = normalizeText(c.req.query('campaignId'));
  const q = normalizeText(c.req.query('q'));
  const status = normalizeText(c.req.query('status')) || 'all';
  if (!campaignId) return errorResponse(400, 'CAMPAIGN_REQUIRED', 'campaignId es requerido.');
  if (status !== 'all' && !REFERRAL_STATUSES.includes(status as (typeof REFERRAL_STATUSES)[number])) return errorResponse(400, 'INVALID_STATUS', 'Status inválido.');

  try {
    const conditions = ['r.campaign_id = ?'];
    const bindings: string[] = [campaignId];
    if (status !== 'all') {
      conditions.push('r.status = ?');
      bindings.push(status);
    }
    if (q) {
      const phone = normalizePhone(q);
      conditions.push('(c.code LIKE ? OR UPPER(r.referrer_name) LIKE ? OR UPPER(r.referred_customer_name) LIKE ? OR r.referrer_phone LIKE ? OR r.referred_customer_phone LIKE ? OR o.folio LIKE ?)');
      bindings.push(`%${q.toUpperCase()}%`, `%${q.toUpperCase()}%`, `%${q.toUpperCase()}%`, `%${phone || q}%`, `%${phone || q}%`, `%${q.toUpperCase()}%`);
    }
    const result = await c.env.BOG_MENU_DB!.prepare(
      `SELECT r.*, c.code, o.folio AS referred_order_folio
       FROM raffle_referrals_v2 r
       JOIN raffle_referral_codes_v2 c ON c.id = r.referral_code_id
       JOIN orders_v2 o ON o.id = r.referred_order_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.created_at DESC LIMIT 150`
    )
      .bind(...bindings)
      .all<ReferralRow>();
    const response: RaffleReferralsAdminResponse = { ok: true, data: { referrals: (result.results ?? []).map(mapReferral) } };
    return json(200, response);
  } catch {
    return errorResponse(500, 'REFERRALS_LIST_FAILED', 'No se pudieron cargar pedidos referidos.');
  }
});

// PATCH /api/raffles-v2-admin/referrals/:id
rafflesAdminRouter.patch('/referrals/:id', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ID', 'Id inválido.');
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = body as UpdateRaffleReferralPayload;
  const status = normalizeText(payload.status);
  const invalidReason = normalizeText(payload.invalidReason);
  if (!REFERRAL_STATUSES.includes(status as (typeof REFERRAL_STATUSES)[number])) return errorResponse(400, 'INVALID_STATUS', 'Status inválido.');
  if (status === 'invalid' && invalidReason.length < 3) return errorResponse(400, 'INVALID_REASON_REQUIRED', 'Razón requerida para invalidar.');
  if (invalidReason.length > 300) return errorResponse(400, 'INVALID_REASON_TOO_LONG', 'La razón excede el máximo.');
  try {
    await c.env.BOG_MENU_DB!.prepare('UPDATE raffle_referrals_v2 SET status = ?, invalid_reason = ?, updated_at = ? WHERE id = ?')
      .bind(status, status === 'invalid' ? invalidReason : null, new Date().toISOString(), id)
      .run();
    const row = await c.env.BOG_MENU_DB!.prepare(
      `SELECT r.*, c.code, o.folio AS referred_order_folio
       FROM raffle_referrals_v2 r
       JOIN raffle_referral_codes_v2 c ON c.id = r.referral_code_id
       JOIN orders_v2 o ON o.id = r.referred_order_id
       WHERE r.id = ? LIMIT 1`
    )
      .bind(id)
      .first<ReferralRow>();
    if (!row) return errorResponse(404, 'REFERRAL_NOT_FOUND', 'Referido no encontrado.');
    const response: RaffleReferralMutationResponse = { ok: true, data: { referral: mapReferral(row) } };
    return json(200, response);
  } catch {
    return errorResponse(500, 'REFERRAL_UPDATE_FAILED', 'No se pudo actualizar el referido.');
  }
});

// GET /api/raffles-v2-admin/summary
rafflesAdminRouter.get('/summary', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;

  const campaignId = c.req.query('campaignId')?.trim() || null;
  const q = (c.req.query('q') ?? '').trim();

  try {
    const campaign = await getCampaignForSummary(c.env.BOG_MENU_DB!, campaignId);
    if (campaignId && !campaign) return errorResponse(404, 'RAFFLE_NOT_FOUND', 'Sorteo no encontrado.');
    const summary = await calculateSummary(c.env.BOG_MENU_DB!, campaign, q);
    const payload: RaffleSummaryResponse = {
      ok: true,
      data: {
        campaign,
        ...summary
      }
    };
    return json(200, payload);
  } catch {
    return errorResponse(500, 'RAFFLES_SUMMARY_FAILED', 'No se pudo calcular el resumen del sorteo.');
  }
});

// POST /api/raffles-v2-admin/ticket-adjustments
rafflesAdminRouter.post('/ticket-adjustments', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = body as Partial<CreateRaffleTicketAdjustmentPayload>;
  const campaignId = normalizeText(payload.campaignId);
  const participantKey = normalizeText(payload.participantKey);
  const reason = normalizeText(payload.reason);
  const actor = normalizeText(payload.actor) || 'internal-v2';
  const ticketsDelta = Number(payload.ticketsDelta);

  if (!campaignId) return errorResponse(400, 'CAMPAIGN_REQUIRED', 'campaignId es requerido.');
  if (!participantKey) return errorResponse(400, 'PARTICIPANT_REQUIRED', 'participantKey es requerido.');
  if (!Number.isInteger(ticketsDelta) || ticketsDelta <= 0 || ticketsDelta > 100) return errorResponse(400, 'INVALID_TICKETS', 'ticketsDelta debe ser un entero de 1 a 100.');
  if (reason.length < 3) return errorResponse(400, 'INVALID_REASON', 'El motivo es obligatorio.');
  if (reason.length > 300) return errorResponse(400, 'INVALID_REASON', 'El motivo excede el máximo permitido.');
  if (actor.length > 80) return errorResponse(400, 'INVALID_ACTOR', 'actor excede el máximo permitido.');

  try {
    const campaign = await getCampaignForSummary(c.env.BOG_MENU_DB!, campaignId);
    if (!campaign) return errorResponse(404, 'RAFFLE_NOT_FOUND', 'Sorteo no encontrado.');

    const summary = await calculateSummary(c.env.BOG_MENU_DB!, campaign, participantKey);
    const participant =
      summary.participantResults.find((item) => item.participantKey === participantKey) ??
      summary.topParticipants.find((item) => item.participantKey === participantKey);
    if (!participant) return errorResponse(404, 'PARTICIPANT_NOT_FOUND', 'Participante no encontrado en la campaña.');

    const now = new Date().toISOString();
    const id = generateId('raffleadj');
    await c.env.BOG_MENU_DB!.prepare(
      `INSERT INTO raffle_ticket_adjustments_v2
       (id, campaign_id, participant_key, participant_name, participant_phone_masked, tickets_delta, reason, actor, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(id, campaignId, participant.participantKey, participant.customerName, participant.customerPhoneMasked, ticketsDelta, reason, actor, now, now)
      .run();

    const row = await c.env.BOG_MENU_DB!.prepare(
      `SELECT id, campaign_id, participant_key, participant_name, participant_phone_masked, tickets_delta, reason, actor, status, created_at, updated_at, reverted_at, reverted_by
       FROM raffle_ticket_adjustments_v2
       WHERE id = ? LIMIT 1`
    )
      .bind(id)
      .first<RaffleTicketAdjustmentRow>();
    if (!row) throw new Error('Missing inserted adjustment');

    const response: RaffleTicketAdjustmentMutationResponse = { ok: true, data: { adjustment: mapTicketAdjustment(row) } };
    return json(201, response);
  } catch {
    return errorResponse(500, 'RAFFLE_ADJUSTMENT_CREATE_FAILED', 'No se pudo guardar el ajuste de tickets.');
  }
});

// PATCH /api/raffles-v2-admin/ticket-adjustments/:id
rafflesAdminRouter.patch('/ticket-adjustments/:id', async (c) => {
  const authError = await requireRaffleAdmin(c.req.raw, c.env);
  if (authError) return authError;
  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ID', 'Id inválido.');
  const body = await readJsonPayload(c.req.raw);
  if (body instanceof Response) return body;
  const payload = body as Partial<UpdateRaffleTicketAdjustmentPayload>;
  const status = normalizeText(payload.status);
  const actor = normalizeText(payload.actor) || 'internal-v2';

  if (status !== 'active' && status !== 'reverted') return errorResponse(400, 'INVALID_STATUS', 'Status inválido.');
  if (actor.length > 80) return errorResponse(400, 'INVALID_ACTOR', 'actor excede el máximo permitido.');

  try {
    const existing = await c.env.BOG_MENU_DB!.prepare(
      `SELECT id, campaign_id, participant_key, participant_name, participant_phone_masked, tickets_delta, reason, actor, status, created_at, updated_at, reverted_at, reverted_by
       FROM raffle_ticket_adjustments_v2
       WHERE id = ? LIMIT 1`
    )
      .bind(id)
      .first<RaffleTicketAdjustmentRow>();
    if (!existing) return errorResponse(404, 'RAFFLE_ADJUSTMENT_NOT_FOUND', 'Ajuste no encontrado.');

    const now = new Date().toISOString();
    await c.env.BOG_MENU_DB!.prepare(
      `UPDATE raffle_ticket_adjustments_v2
       SET status = ?, reverted_at = ?, reverted_by = ?, actor = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(status, status === 'reverted' ? now : null, status === 'reverted' ? actor : null, actor, now, id)
      .run();

    const row = await c.env.BOG_MENU_DB!.prepare(
      `SELECT id, campaign_id, participant_key, participant_name, participant_phone_masked, tickets_delta, reason, actor, status, created_at, updated_at, reverted_at, reverted_by
       FROM raffle_ticket_adjustments_v2
       WHERE id = ? LIMIT 1`
    )
      .bind(id)
      .first<RaffleTicketAdjustmentRow>();
    if (!row) return errorResponse(404, 'RAFFLE_ADJUSTMENT_NOT_FOUND', 'Ajuste no encontrado.');

    const response: RaffleTicketAdjustmentMutationResponse = { ok: true, data: { adjustment: mapTicketAdjustment(row) } };
    return json(200, response);
  } catch {
    return errorResponse(500, 'RAFFLE_ADJUSTMENT_UPDATE_FAILED', 'No se pudo actualizar el ajuste.');
  }
});
