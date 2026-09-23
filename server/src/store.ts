import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Booking, BookingItem, CreateEventInput, EventDetails, EventSummary, PaymentIntent, Ticket, User, UserRole } from '@eventra/shared';
import { conflict, forbidden, notFound, unauthorized } from './errors.js';

type UserRecord = User & { passwordHash: string; verified: boolean };
type EventRecord = EventDetails & { organizerId: string };
type HoldRecord = { id: string; userId: string; eventId: string; items: BookingItem[]; expiresAt: number; status: 'active' | 'consumed' | 'released' };
type PaymentRecord = PaymentIntent & { userId: string; idempotencyKey: string; bookingId?: string };
type BookingRecord = Booking & { userId: string };

const now = () => new Date().toISOString();

export class MemoryStore {
  readonly users = new Map<string, UserRecord>();
  readonly events = new Map<string, EventRecord>();
  readonly holds = new Map<string, HoldRecord>();
  readonly payments = new Map<string, PaymentRecord>();
  readonly bookings = new Map<string, BookingRecord>();
  readonly tickets = new Map<string, Ticket>();

  constructor() {
    const attendee = this.addUser({ name: 'Demo Attendee', email: 'demo@eventra.test', role: 'attendee', passwordHash: bcrypt.hashSync('DemoPass123!', 12) });
    const organizer = this.addUser({ name: 'Maya Chen', email: 'organizer@eventra.test', role: 'organizer', passwordHash: bcrypt.hashSync('DemoPass123!', 12) });
    this.addUser({ name: 'Venue Check-in', email: 'staff@eventra.test', role: 'staff', passwordHash: bcrypt.hashSync('DemoPass123!', 12) });
    this.addUser({ name: 'Eventra Admin', email: 'admin@eventra.test', role: 'admin', passwordHash: bcrypt.hashSync('DemoPass123!', 12) });

    const seeded: EventRecord[] = [
      {
        id: 'evt_neon_nights', slug: 'neon-nights', title: 'Neon Nights: After Dark', category: 'Music', date: '2026-10-18', time: '8:00 PM', venue: 'The Signal Factory', city: 'Austin, TX', address: '1100 E 5th Street, Austin, TX', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85', accent: '#c6f36b', priceFrom: 48, status: 'published', featured: true, attendees: 834, organizerId: organizer.id, description: 'A kinetic night of live electronic sets, laser architecture, and the kind of bassline that changes your route home.', organizer: { id: organizer.id, name: organizer.name, verified: true }, tags: ['electronic', 'late night', 'live'], refundPolicy: 'Full refund up to 7 days before the event.', ticketTypes: [{ id: 'tt_neon_general', name: 'General Admission', description: 'Floor access and full soundstage view.', price: 48, currency: 'USD', capacity: 900, available: 214 }, { id: 'tt_neon_vip', name: 'Backstage Orbit', description: 'Fast lane, elevated deck, and artist lounge access.', price: 120, currency: 'USD', capacity: 80, available: 18 }], faqs: [{ question: 'Is this event 21+?', answer: 'Yes. Bring a valid photo ID.' }],
      },
      {
        id: 'evt_future_makers', slug: 'future-makers', title: 'Future Makers Assembly', category: 'Conference', date: '2026-11-06', time: '9:30 AM', venue: 'Assembly Hall', city: 'Brooklyn, NY', address: '15 Wythe Avenue, Brooklyn, NY', imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=85', accent: '#70d9ff', priceFrom: 95, status: 'published', featured: true, attendees: 1290, organizerId: organizer.id, description: 'Two days for builders shaping the next useful internet: talks, workshops, and collision-rich rooms.', organizer: { id: organizer.id, name: organizer.name, verified: true }, tags: ['design', 'technology', 'workshops'], refundPolicy: 'Refunds available until 14 days before opening keynote.', ticketTypes: [{ id: 'tt_future_standard', name: 'Standard Pass', description: 'All talks and the community floor.', price: 95, currency: 'USD', capacity: 1400, available: 563 }, { id: 'tt_future_workshop', name: 'Workshop Pass', description: 'Standard access plus one hands-on workshop.', price: 160, currency: 'USD', capacity: 200, available: 42 }], faqs: [{ question: 'Does this include meals?', answer: 'Coffee, lunch, and the closing social are included.' }],
      },
      {
        id: 'evt_moon_market', slug: 'moon-market', title: 'Moon Market / Vol. 04', category: 'Culture', date: '2026-09-28', time: '6:00 PM', venue: 'The Foundry', city: 'Chicago, IL', address: '2200 W Fulton Street, Chicago, IL', imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=85', accent: '#ff8d7a', priceFrom: 18, status: 'published', featured: false, attendees: 392, organizerId: organizer.id, description: 'Independent makers, midnight food, vinyl selectors, and a room full of objects with a story.', organizer: { id: organizer.id, name: organizer.name, verified: true }, tags: ['market', 'food', 'local'], refundPolicy: 'Tickets are refundable until 48 hours before doors.', ticketTypes: [{ id: 'tt_moon_entry', name: 'Entry', description: 'Market access and live programming.', price: 18, currency: 'USD', capacity: 600, available: 208 }], faqs: [{ question: 'Can I bring children?', answer: 'Yes, before 9 PM.' }],
      },
    ];
    seeded.forEach(event => this.events.set(event.id, event));
    void attendee;
  }

  private addUser(input: Omit<UserRecord, 'id' | 'verified'>): UserRecord {
    const user: UserRecord = { ...input, id: randomUUID(), verified: true };
    this.users.set(user.id, user);
    return user;
  }

  publicUser(user: UserRecord): User {
    const { passwordHash: _passwordHash, verified: _verified, ...safeUser } = user;
    return safeUser;
  }

  findUserByEmail(email: string): UserRecord | undefined {
    return [...this.users.values()].find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  getUser(id: string): UserRecord {
    const user = this.users.get(id);
    if (!user) throw unauthorized();
    return user;
  }

  createUser(input: { name: string; email: string; passwordHash: string; role?: UserRole }): UserRecord {
    if (this.findUserByEmail(input.email)) throw conflict('An account with that email already exists');
    return this.addUser({ ...input, role: input.role ?? 'attendee' });
  }

  listEvents(filters: { q?: string; category?: string; city?: string; page: number; pageSize: number }): { data: EventSummary[]; totalItems: number } {
    const q = filters.q?.toLowerCase();
    const results = [...this.events.values()].filter(event => {
      if (event.status !== 'published') return false;
      if (q && !`${event.title} ${event.description} ${event.city} ${event.category}`.toLowerCase().includes(q)) return false;
      if (filters.category && event.category !== filters.category) return false;
      if (filters.city && event.city !== filters.city) return false;
      return true;
    });
    return { data: results.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize).map(this.toSummary), totalItems: results.length };
  }

  getEvent(id: string): EventRecord {
    const event = this.events.get(id);
    if (!event) throw notFound('Event not found');
    return event;
  }

  createEvent(input: CreateEventInput, organizerId: string): EventRecord {
    const organizer = this.getUser(organizerId);
    const ticketTypes = input.ticketTypes.map(ticket => ({ ...ticket, id: randomUUID(), available: ticket.capacity }));
    const event: EventRecord = {
      ...input,
      id: randomUUID(),
      status: 'pending_review',
      featured: false,
      attendees: 0,
      organizerId,
      organizer: { id: organizer.id, name: organizer.name, verified: organizer.verified },
      ticketTypes,
      priceFrom: Math.min(...ticketTypes.map(ticket => ticket.price)),
    };
    this.events.set(event.id, event);
    return event;
  }

  publishEvent(id: string, actorId: string): EventRecord {
    const event = this.getEvent(id);
    const actor = this.getUser(actorId);
    if (actor.role !== 'admin' && event.organizerId !== actorId) throw unauthorized('You cannot publish this event');
    event.status = 'published';
    return event;
  }

  private releaseExpiredHolds(): void {
    const timestamp = Date.now();
    for (const hold of this.holds.values()) {
      if (hold.status === 'active' && hold.expiresAt <= timestamp) {
        const event = this.getEvent(hold.eventId);
        for (const item of hold.items) {
          const ticket = event.ticketTypes.find(type => type.id === item.ticketTypeId);
          if (ticket) ticket.available += item.quantity;
        }
        hold.status = 'released';
      }
    }
  }

  createHold(userId: string, eventId: string, items: BookingItem[]): HoldRecord {
    this.releaseExpiredHolds();
    const event = this.getEvent(eventId);
    if (event.status !== 'published') throw conflict('This event is not currently available');
    if (items.length === 0 || items.some(item => item.quantity < 1 || item.quantity > 8)) throw conflict('Select between 1 and 8 tickets per type');
    const normalizedItems: BookingItem[] = [];
    for (const item of items) {
      const ticket = event.ticketTypes.find(type => type.id === item.ticketTypeId);
      if (!ticket) throw notFound('Ticket type not found');
      if (ticket.available < item.quantity) throw conflict(`${ticket.name} has only ${ticket.available} tickets left`);
      normalizedItems.push({ ticketTypeId: ticket.id, ticketName: ticket.name, quantity: item.quantity, unitPrice: ticket.price });
    }
    for (const item of normalizedItems) event.ticketTypes.find(type => type.id === item.ticketTypeId)!.available -= item.quantity;
    const hold: HoldRecord = { id: randomUUID(), userId, eventId, items: normalizedItems, expiresAt: Date.now() + 10 * 60 * 1000, status: 'active' };
    this.holds.set(hold.id, hold);
    return hold;
  }

  getHold(id: string, userId: string): HoldRecord {
    this.releaseExpiredHolds();
    const hold = this.holds.get(id);
    if (!hold || hold.userId !== userId || hold.status !== 'active') throw conflict('This ticket hold is no longer active');
    return hold;
  }

  createPayment(userId: string, holdId: string, idempotencyKey: string): PaymentRecord {
    const existing = [...this.payments.values()].find(payment => payment.idempotencyKey === idempotencyKey && payment.userId === userId);
    if (existing) {
      if (existing.holdId !== holdId) throw conflict('This idempotency key was already used for another hold');
      return existing;
    }
    const hold = this.getHold(holdId, userId);
    const amount = hold.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
    const payment: PaymentRecord = { id: randomUUID(), userId, holdId, amount, currency: 'USD', status: 'created', idempotencyKey };
    this.payments.set(payment.id, payment);
    return payment;
  }

  verifyPayment(userId: string, paymentId: string): Booking {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.userId !== userId) throw notFound('Payment not found');
    if (payment.bookingId) return this.bookings.get(payment.bookingId)!;
    const hold = this.getHold(payment.holdId, userId);
    const event = this.getEvent(hold.eventId);
    payment.status = 'verified';
    const bookingId = randomUUID();
    const reference = `EVT-${referenceCode()}`;
    const tickets: Ticket[] = hold.items.flatMap(item => Array.from({ length: item.quantity }, () => {
      const ticket: Ticket = { id: randomUUID(), bookingId, eventId: event.id, eventTitle: event.title, attendeeName: this.getUser(userId).name, ticketName: item.ticketName, date: `${event.date} · ${event.time}`, venue: event.venue, validationToken: randomUUID() };
      this.tickets.set(ticket.id, ticket);
      return ticket;
    }));
    const booking: BookingRecord = { id: bookingId, userId, reference, event: this.toSummary(event), items: hold.items, total: payment.amount, currency: 'USD', status: 'confirmed', createdAt: now(), tickets };
    this.bookings.set(booking.id, booking);
    payment.bookingId = booking.id;
    hold.status = 'consumed';
    event.attendees += tickets.length;
    return booking;
  }

  listBookings(userId: string): Booking[] {
    this.getUser(userId);
    return [...this.bookings.values()].filter(booking => booking.userId === userId).map(({ userId: _userId, ...booking }) => booking);
  }

  getBooking(id: string, userId: string): Booking {
    const booking = this.bookings.get(id);
    if (!booking || booking.userId !== userId) throw notFound('Booking not found');
    const { userId: _userId, ...publicBooking } = booking;
    return publicBooking;
  }

  getTicket(id: string): Ticket {
    const ticket = this.tickets.get(id);
    if (!ticket) throw notFound('Ticket not found');
    return ticket;
  }

  validateTicket(token: string, actorId: string, actorRole: UserRole): Ticket {
    const ticket = [...this.tickets.values()].find(item => item.validationToken === token);
    if (!ticket) throw notFound('Ticket token is invalid');
    if (actorRole === 'organizer' && this.getEvent(ticket.eventId).organizerId !== actorId) throw forbidden('You cannot validate tickets for this event');
    if (ticket.redeemedAt) throw conflict('This ticket has already been redeemed', { redeemedAt: ticket.redeemedAt });
    ticket.redeemedAt = now();
    return ticket;
  }

  summary() {
    return { users: this.users.size, events: this.events.size, publishedEvents: [...this.events.values()].filter(event => event.status === 'published').length, pendingEvents: [...this.events.values()].filter(event => event.status === 'pending_review').length, bookings: this.bookings.size, ticketsRedeemed: [...this.tickets.values()].filter(ticket => ticket.redeemedAt).length, grossVolume: [...this.bookings.values()].reduce((sum, booking) => sum + booking.total, 0) };
  }

  organizerEvents(userId: string): EventSummary[] {
    return [...this.events.values()].filter(event => event.organizerId === userId).map(this.toSummary);
  }

  adminEvents(): EventSummary[] {
    return [...this.events.values()].map(this.toSummary);
  }

  private readonly toSummary = (event: EventDetails): EventSummary => ({ id: event.id, slug: event.slug, title: event.title, category: event.category, date: event.date, time: event.time, venue: event.venue, city: event.city, imageUrl: event.imageUrl, accent: event.accent, priceFrom: event.priceFrom, status: event.status, featured: event.featured, attendees: event.attendees });
}

function referenceCode(): string {
  return randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
}
