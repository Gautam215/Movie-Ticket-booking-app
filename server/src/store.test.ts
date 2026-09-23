import { describe, expect, it } from 'vitest';
import { MemoryStore } from './store.js';

describe('MemoryStore inventory holds', () => {
  it('returns held inventory after the expiry window passes', () => {
    const store = new MemoryStore();
    const attendee = store.findUserByEmail('demo@eventra.test');
    if (!attendee) throw new Error('Seed attendee missing');

    const event = store.getEvent('evt_moon_market');
    const initialAvailability = event.ticketTypes[0]?.available ?? 0;
    const hold = store.createHold(attendee.id, event.id, [{ ticketTypeId: 'tt_moon_entry', ticketName: '', quantity: 2, unitPrice: 0 }]);
    expect(event.ticketTypes[0]?.available).toBe(initialAvailability - 2);

    const record = store.holds.get(hold.id);
    if (!record) throw new Error('Created hold missing');
    record.expiresAt = Date.now() - 1;
    store.createHold(attendee.id, event.id, [{ ticketTypeId: 'tt_moon_entry', ticketName: '', quantity: 1, unitPrice: 0 }]);

    expect(record.status).toBe('released');
    expect(event.ticketTypes[0]?.available).toBe(initialAvailability - 1);
  });
});
