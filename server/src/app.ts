import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import QRCode from 'qrcode';
import { z } from 'zod';
import type { ApiErrorBody, CreateEventInput } from '@eventra/shared';
import { authCookie, hashPassword, requireAuth, requireRoles, signAccessToken, verifyPassword } from './security.js';
import { AppError, notFound, unauthorized } from './errors.js';
import { env } from './config.js';
import { searchMovies } from './movies.js';
import { MemoryStore } from './store.js';

const idSchema = z.string().trim().min(1).max(120);
const emailSchema = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const passwordSchema = z.string().min(10).max(128);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
const socialLoginSchema = z.object({ provider: z.enum(['google', 'github']) });
const passwordResetSchema = z.object({ email: emailSchema });

const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().trim().min(2).max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().trim().min(2).max(40),
  venue: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(180),
  imageUrl: z.string().url().max(500),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description: z.string().trim().min(20).max(1200),
  ticketTypes: z.array(z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().min(4).max(240),
    price: z.number().finite().min(0).max(100000),
    currency: z.string().trim().length(3).toUpperCase(),
    capacity: z.number().int().min(1).max(100000),
  })).min(1).max(12),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  refundPolicy: z.string().trim().min(10).max(500),
  faqs: z.array(z.object({
    question: z.string().trim().min(4).max(160),
    answer: z.string().trim().min(4).max(500),
  })).max(12).default([]),
});

const paginationSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

const holdSchema = z.object({
  eventId: idSchema,
  items: z.array(z.object({
    ticketTypeId: idSchema,
    quantity: z.number().int().min(1).max(8),
  })).min(1).max(12),
});

const paymentCreateSchema = z.object({ holdId: idSchema });
const paymentVerifySchema = z.object({ paymentId: idSchema });
const ticketValidationSchema = z.object({ token: z.string().trim().min(10).max(120) });
const helpSchema = z.object({ message: z.string().trim().min(1).max(1000) });
const movieQuerySchema = z.object({ q: z.string().trim().max(120).optional() });

type AsyncRoute = (request: express.Request, response: express.Response) => Promise<void>;

export function createApp(store = new MemoryStore()) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, mode: 'demo', persistence: 'memory' });
  });

  app.post('/api/help', asyncRoute(async (request, response) => {
    const input = parse(helpSchema, request.body);
    if (!env.GEMINI_API_KEY) {
      response.json({ reply: localHelpReply(input.message) });
      return;
    }

    const providerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are Eventra help. Answer only questions about event discovery, ticket reservation, server-verified checkout, digital QR tickets, venue validation, and customer, organizer, or admin dashboards. If the question is outside these topics, say you can only help with Eventra.' }] },
        contents: [{ role: 'user', parts: [{ text: input.message }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      }),
    });

    if (!providerResponse.ok) throw new AppError(502, 'HELP_PROVIDER_ERROR', 'The help service is unavailable');
    const payload: unknown = await providerResponse.json();
    const reply = geminiReply(payload);
    if (!reply) throw new AppError(502, 'HELP_PROVIDER_ERROR', 'The help service returned no answer');
    response.json({ reply });
  }));

  app.post('/api/auth/register', authLimiter, asyncRoute(async (request, response) => {
    const input = parse(registerSchema, request.body);
    const user = store.createUser({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password) });
    setSession(response, user);
    response.status(201).json({ user: store.publicUser(user) });
  }));

  app.post('/api/auth/login', authLimiter, asyncRoute(async (request, response) => {
    const input = parse(loginSchema, request.body);
    const user = store.findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw unauthorized('Email or password is incorrect');
    setSession(response, user);
    response.json({ user: store.publicUser(user) });
  }));

  app.post('/api/auth/social', authLimiter, asyncRoute(async (request, response) => {
    const input = parse(socialLoginSchema, request.body);
    const email = `${input.provider}.demo@eventra.test`;
    const existing = store.findUserByEmail(email);
    const user = existing ?? store.createUser({
      name: input.provider === 'google' ? 'Google Demo User' : 'GitHub Demo User',
      email,
      passwordHash: await hashPassword(`eventra-${input.provider}-demo`),
    });
    setSession(response, user);
    response.json({ user: store.publicUser(user) });
  }));

  app.post('/api/auth/password-reset', authLimiter, asyncRoute(async (request, response) => {
    parse(passwordResetSchema, request.body);
    response.json({ message: 'If an Eventra account exists for that email, reset instructions have been queued.' });
  }));

  app.post('/api/auth/logout', (_request, response) => {
    response.clearCookie('eventra_access', authCookie());
    response.status(204).end();
  });

  app.get('/api/auth/me', requireAuth, asyncRoute(async (request, response) => {
    response.json({ user: store.publicUser(currentUser(request, store)) });
  }));

  app.get('/api/events', asyncRoute(async (request, response) => {
    const filters = parse(paginationSchema, request.query);
    const result = store.listEvents(filters);
    response.json({ data: result.data, pagination: pagination(result.totalItems, filters.page, filters.pageSize) });
  }));

  app.get('/api/events/:id', asyncRoute(async (request, response) => {
    const event = store.getEvent(parse(idSchema, request.params.id));
    if (event.status !== 'published') throw notFound('Event not found');
    response.json(publicEvent(event));
  }));

  app.get('/api/movies', asyncRoute(async (request, response) => {
    const input = parse(movieQuerySchema, request.query);
    response.json(await searchMovies(input.q));
  }));

  app.post('/api/events', requireAuth, requireRoles('organizer', 'admin'), asyncRoute(async (request, response) => {
    const input = parse(eventSchema, request.body);
    const event = store.createEvent(input satisfies CreateEventInput, request.auth!.userId);
    response.status(201).json(publicEvent(event));
  }));

  app.get('/api/organizer/events', requireAuth, requireRoles('organizer', 'admin'), asyncRoute(async (request, response) => {
    response.json({ data: store.organizerEvents(request.auth!.userId) });
  }));

  app.post('/api/events/:id/publish', requireAuth, requireRoles('organizer', 'admin'), asyncRoute(async (request, response) => {
    response.json(publicEvent(store.publishEvent(parse(idSchema, request.params.id), request.auth!.userId)));
  }));

  app.post('/api/bookings/hold', requireAuth, asyncRoute(async (request, response) => {
    const input = parse(holdSchema, request.body);
    const hold = store.createHold(request.auth!.userId, input.eventId, input.items.map(item => ({ ...item, ticketName: '', unitPrice: 0 })));
    response.status(201).json({ id: hold.id, eventId: hold.eventId, items: hold.items, expiresAt: new Date(hold.expiresAt).toISOString() });
  }));

  app.post('/api/payments/create', requireAuth, asyncRoute(async (request, response) => {
    const input = parse(paymentCreateSchema, request.body);
    const idempotencyKey = request.header('Idempotency-Key')?.trim();
    if (!idempotencyKey || idempotencyKey.length > 120) throw new AppError(422, 'VALIDATION_ERROR', 'A valid Idempotency-Key header is required');
    const payment = store.createPayment(request.auth!.userId, input.holdId, idempotencyKey);
    response.status(201).json(publicPayment(payment));
  }));

  app.post('/api/payments/verify', requireAuth, asyncRoute(async (request, response) => {
    const input = parse(paymentVerifySchema, request.body);
    response.status(201).json(store.verifyPayment(request.auth!.userId, input.paymentId));
  }));

  app.get('/api/bookings', requireAuth, asyncRoute(async (request, response) => {
    response.json({ data: store.listBookings(request.auth!.userId) });
  }));

  app.get('/api/bookings/:id', requireAuth, asyncRoute(async (request, response) => {
    response.json(store.getBooking(parse(idSchema, request.params.id), request.auth!.userId));
  }));

  app.get('/api/tickets/:id', requireAuth, asyncRoute(async (request, response) => {
    const ticket = store.getTicket(parse(idSchema, request.params.id));
    const role = request.auth!.role;
    if (role === 'organizer' && store.getEvent(ticket.eventId).organizerId !== request.auth!.userId) throw notFound('Ticket not found');
    if (!['staff', 'organizer', 'admin'].includes(role)) store.getBooking(ticket.bookingId, request.auth!.userId);
    response.json({ ticket, qrDataUrl: await QRCode.toDataURL(ticket.validationToken, { margin: 1, width: 280 }) });
  }));

  app.post('/api/tickets/validate', requireAuth, requireRoles('staff', 'organizer', 'admin'), asyncRoute(async (request, response) => {
    const input = parse(ticketValidationSchema, request.body);
    response.json(store.validateTicket(input.token, request.auth!.userId, request.auth!.role));
  }));

  app.get('/api/admin/summary', requireAuth, requireRoles('admin'), asyncRoute(async (_request, response) => {
    response.json(store.summary());
  }));

  app.get('/api/admin/events', requireAuth, requireRoles('admin'), asyncRoute(async (_request, response) => {
    response.json({ data: store.adminEvents() });
  }));

  app.use((_request, _response, next) => next(notFound('Route not found')));
  app.use(errorHandler);
  return app;

  function setSession(response: express.Response, user: ReturnType<MemoryStore['createUser']>): void {
    const token = signAccessToken({ sub: user.id, role: user.role });
    response.cookie('eventra_access', token, authCookie());
  }
}

function asyncRoute(handler: AsyncRoute): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

function currentUser(request: express.Request, store: MemoryStore) {
  if (!request.auth) throw unauthorized();
  return store.getUser(request.auth.userId);
}

function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(422, 'VALIDATION_ERROR', 'The request could not be validated', result.error.flatten());
  return result.data;
}

function pagination(totalItems: number, page: number, pageSize: number) {
  return { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) };
}

function geminiReply(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('candidates' in payload) || !Array.isArray(payload.candidates)) return null;
  const first = payload.candidates[0];
  if (!first || typeof first !== 'object' || !('content' in first) || !first.content || typeof first.content !== 'object' || !('parts' in first.content) || !Array.isArray(first.content.parts)) return null;
  const text = first.content.parts.find((part: unknown): part is { text: string } => part !== null && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string');
  return text?.text.trim() ?? null;
}

function localHelpReply(message: string): string {
  const question = message.toLowerCase();
  if (question.includes('qr') || question.includes('ticket')) return 'After payment is verified, open My tickets and choose View QR on any ticket. The QR payload is server-generated and can be scanned at entry.';
  if (question.includes('reserve') || question.includes('checkout') || question.includes('pay')) return 'Choose a ticket quantity on an event page, create a ten-minute hold, then select Verify payment. Eventra confirms payment on the server before creating the booking.';
  if (question.includes('find') || question.includes('event') || question.includes('search')) return 'Use Discover to search by title, city, or venue, then filter by Music, Conference, or Culture. Select any event to see its schedule, venue, pricing, and availability.';
  return 'Eventra help covers event discovery, ticket reservation, server-verified checkout, QR tickets, and venue validation.';
}

function publicEvent(event: ReturnType<MemoryStore['getEvent']>) {
  const { organizerId: _organizerId, ...safeEvent } = event;
  return safeEvent;
}

function publicPayment(payment: ReturnType<MemoryStore['createPayment']>) {
  const { userId: _userId, idempotencyKey: _idempotencyKey, bookingId: _bookingId, ...safePayment } = payment;
  return safePayment;
}

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error instanceof AppError) {
    const body: ApiErrorBody = { error: { code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }) } };
    response.status(error.status).json(body);
    return;
  }
  console.error(error);
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } } satisfies ApiErrorBody);
};
