import { Schema, model } from 'mongoose';

const TicketTypeSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  capacity: { type: Number, required: true, min: 1 },
  available: { type: Number, required: true, min: 0 },
}, { _id: true });

export const UserModel = model('User', new Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: { type: String, enum: ['attendee', 'organizer', 'staff', 'admin'], default: 'attendee' }, verified: Boolean }, { timestamps: true }));
export const EventModel = model('Event', new Schema({ title: String, slug: { type: String, unique: true }, category: String, date: String, time: String, venue: String, city: String, address: String, imageUrl: String, accent: String, priceFrom: Number, status: String, featured: Boolean, attendees: Number, organizerId: Schema.Types.ObjectId, description: String, organizer: Object, ticketTypes: [TicketTypeSchema], tags: [String], refundPolicy: String, faqs: [Object] }, { timestamps: true }));
export const BookingModel = model('Booking', new Schema({ reference: { type: String, unique: true }, userId: Schema.Types.ObjectId, eventId: Schema.Types.ObjectId, items: [Object], total: Number, currency: String, status: String, tickets: [Object] }, { timestamps: true }));
