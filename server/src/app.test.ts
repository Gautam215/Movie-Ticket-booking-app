import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

async function signedIn(app: ReturnType<typeof createApp>, email = 'demo@eventra.test') {
  const response = await request(app).post('/api/auth/login').send({ email, password: 'DemoPass123!' });
  expect(response.status).toBe(200);
  const cookies = response.headers['set-cookie'];
  if (!cookies) throw new Error('Login did not set a session cookie');
  return Array.isArray(cookies) ? cookies : [cookies];
}

describe('Eventra API', () => {
  it('connects social sign-in and password reset actions to auth routes', async () => {
    const app = createApp();
    const reset = await request(app).post('/api/auth/password-reset').send({ email: 'demo@eventra.test' });
    const social = await request(app).post('/api/auth/social').send({ provider: 'github' });

    expect(reset.status).toBe(200);
    expect(reset.body.message).toContain('reset instructions');
    expect(social.status).toBe(200);
    expect(social.body.user.email).toBe('github.demo@eventra.test');
    expect(social.headers['set-cookie']).toBeDefined();
  });

  it('returns movie discovery data without requiring a TMDB key', async () => {
    const app = createApp();
    const response = await request(app).get('/api/movies');

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('demo');
    expect(response.body.data).toHaveLength(6);
    expect(response.body.data.map((movie: { industry: string }) => movie.industry)).toEqual(expect.arrayContaining(['Bollywood', 'Tollywood', 'Hollywood']));
  });

  it('lists only published events with pagination metadata', async () => {
    const app = createApp();
    const response = await request(app).get('/api/events?page=1&pageSize=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({ page: 1, pageSize: 1, totalItems: 3, totalPages: 3 });
  });

  it('creates an idempotent payment and one booking', async () => {
    const app = createApp();
    const cookies = await signedIn(app);
    const hold = await request(app)
      .post('/api/bookings/hold')
      .set('Cookie', cookies)
      .send({ eventId: 'evt_neon_nights', items: [{ ticketTypeId: 'tt_neon_general', quantity: 2 }] });

    expect(hold.status).toBe(201);
    expect(hold.body.items[0].unitPrice).toBe(48);

    const firstPayment = await request(app)
      .post('/api/payments/create')
      .set('Cookie', cookies)
      .set('Idempotency-Key', 'test-payment-1')
      .send({ holdId: hold.body.id });
    const replayedPayment = await request(app)
      .post('/api/payments/create')
      .set('Cookie', cookies)
      .set('Idempotency-Key', 'test-payment-1')
      .send({ holdId: hold.body.id });

    expect(firstPayment.status).toBe(201);
    expect(replayedPayment.body.id).toBe(firstPayment.body.id);

    const firstBooking = await request(app).post('/api/payments/verify').set('Cookie', cookies).send({ paymentId: firstPayment.body.id });
    const replayedBooking = await request(app).post('/api/payments/verify').set('Cookie', cookies).send({ paymentId: firstPayment.body.id });

    expect(firstBooking.status).toBe(201);
    expect(replayedBooking.body.id).toBe(firstBooking.body.id);
    expect((await request(app).get('/api/bookings').set('Cookie', cookies)).body.data).toHaveLength(1);
  });

  it('scopes bookings to the authenticated owner', async () => {
    const app = createApp();
    const attendeeCookies = await signedIn(app);
    const adminCookies = await signedIn(app, 'admin@eventra.test');
    const hold = await request(app).post('/api/bookings/hold').set('Cookie', attendeeCookies).send({ eventId: 'evt_moon_market', items: [{ ticketTypeId: 'tt_moon_entry', quantity: 1 }] });
    const payment = await request(app).post('/api/payments/create').set('Cookie', attendeeCookies).set('Idempotency-Key', 'owner-scope-test').send({ holdId: hold.body.id });
    const booking = await request(app).post('/api/payments/verify').set('Cookie', attendeeCookies).send({ paymentId: payment.body.id });

    const response = await request(app).get(`/api/bookings/${booking.body.id}`).set('Cookie', adminCookies);
    expect(response.status).toBe(404);
  });

  it('rejects attendee access to the admin summary', async () => {
    const app = createApp();
    const cookies = await signedIn(app);
    const response = await request(app).get('/api/admin/summary').set('Cookie', cookies);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('does not expose draft event details and formats invalid path input', async () => {
    const app = createApp();
    const organizerCookies = await signedIn(app, 'organizer@eventra.test');
    const created = await request(app).post('/api/events').set('Cookie', organizerCookies).send({
      title: 'Private Test Event',
      slug: 'private-test-event',
      category: 'Culture',
      date: '2026-12-01',
      time: '7:00 PM',
      venue: 'Test Hall',
      city: 'Austin, TX',
      address: '1 Test Street, Austin, TX',
      imageUrl: 'https://example.com/test.jpg',
      accent: '#c6f36b',
      description: 'A private event used to verify public visibility rules.',
      ticketTypes: [{ name: 'Entry', description: 'General entry.', price: 20, currency: 'USD', capacity: 100 }],
      tags: ['test'],
      refundPolicy: 'Refundable until one day before the event.',
      faqs: [],
    });
    expect(created.status).toBe(201);

    const hidden = await request(app).get(`/api/events/${created.body.id}`);
    const invalid = await request(app).get('/api/events/%20');
    expect(hidden.status).toBe(404);
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lets admins review listings and staff redeem a ticket once', async () => {
    const app = createApp();
    const organizerCookies = await signedIn(app, 'organizer@eventra.test');
    const adminCookies = await signedIn(app, 'admin@eventra.test');
    const staffCookies = await signedIn(app, 'staff@eventra.test');

    const created = await request(app).post('/api/events').set('Cookie', organizerCookies).send({
      title: 'Review Queue Test', slug: 'review-queue-test', category: 'Culture', date: '2026-12-01', time: '7:00 PM', venue: 'Test Hall', city: 'Austin, TX', address: '1 Test Street, Austin, TX', imageUrl: 'https://example.com/review.jpg', accent: '#c6f36b', description: 'A review queue event used to verify moderation and entry operations.', ticketTypes: [{ name: 'Entry', description: 'General entry.', price: 20, currency: 'USD', capacity: 100 }], tags: ['test'], refundPolicy: 'Refundable until one day before the event.', faqs: [],
    });
    expect(created.status).toBe(201);

    const review = await request(app).get('/api/admin/events').set('Cookie', adminCookies);
    expect(review.status).toBe(200);
    expect(review.body.data.find((event: { id: string }) => event.id === created.body.id).status).toBe('pending_review');
    expect((await request(app).post(`/api/events/${created.body.id}/publish`).set('Cookie', adminCookies)).status).toBe(200);

    const hold = await request(app).post('/api/bookings/hold').set('Cookie', organizerCookies).send({ eventId: 'evt_neon_nights', items: [{ ticketTypeId: 'tt_neon_general', quantity: 1 }] });
    const payment = await request(app).post('/api/payments/create').set('Cookie', organizerCookies).set('Idempotency-Key', 'staff-validation-test').send({ holdId: hold.body.id });
    const booking = await request(app).post('/api/payments/verify').set('Cookie', organizerCookies).send({ paymentId: payment.body.id });
    const ticket = booking.body.tickets[0];

    const access = await request(app).get(`/api/tickets/${ticket.id}`).set('Cookie', organizerCookies);
    expect(access.status).toBe(200);
    expect(access.body.qrDataUrl).toMatch(/^data:image\/png/);
    const validated = await request(app).post('/api/tickets/validate').set('Cookie', staffCookies).send({ token: ticket.validationToken });
    expect(validated.status).toBe(200);
    expect((await request(app).post('/api/tickets/validate').set('Cookie', staffCookies).send({ token: ticket.validationToken })).status).toBe(409);
  });
});
