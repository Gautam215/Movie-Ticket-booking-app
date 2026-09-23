export type UserRole = 'attendee' | 'organizer' | 'staff' | 'admin';

export type EventStatus = 'draft' | 'pending_review' | 'published' | 'cancelled';

export type MovieIndustry = 'Bollywood' | 'Tollywood' | 'Hollywood';

export interface Movie {
  id: string;
  title: string;
  industry: MovieIndustry;
  genre: string;
  releaseDate: string;
  description: string;
  ticketPriceFrom: number;
  currency: string;
  imageUrl: string;
  sourceUrl: string;
  sourceLabel: string;
  runtime: string;
  language: string;
  rating: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  capacity: number;
  available: number;
}

export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  imageUrl: string;
  accent: string;
  priceFrom: number;
  status: EventStatus;
  featured: boolean;
  attendees: number;
}

export interface EventDetails extends EventSummary {
  description: string;
  address: string;
  organizer: { id: string; name: string; verified: boolean };
  ticketTypes: TicketType[];
  tags: string[];
  refundPolicy: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface BookingItem {
  ticketTypeId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
}

export interface Ticket {
  id: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  ticketName: string;
  date: string;
  venue: string;
  validationToken: string;
  redeemedAt?: string;
}

export interface TicketAccess {
  ticket: Ticket;
  qrDataUrl: string;
}

export interface Booking {
  id: string;
  reference: string;
  event: Pick<EventSummary, 'id' | 'title' | 'date' | 'time' | 'venue' | 'imageUrl'>;
  items: BookingItem[];
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  createdAt: string;
  tickets: Ticket[];
}

export interface PaymentIntent {
  id: string;
  holdId: string;
  amount: number;
  currency: string;
  status: 'created' | 'verified' | 'failed';
}

export interface CreateEventInput {
  title: string;
  slug: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  address: string;
  imageUrl: string;
  accent: string;
  description: string;
  ticketTypes: Array<Omit<TicketType, 'id' | 'available'>>;
  tags: string[];
  refundPolicy: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface AdminSummary {
  users: number;
  events: number;
  publishedEvents: number;
  pendingEvents: number;
  bookings: number;
  ticketsRedeemed: number;
  grossVolume: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
