import type { AdminSummary, ApiErrorBody, Booking, BookingItem, CreateEventInput, EventDetails, EventSummary, Movie, PaymentIntent, Paginated, TicketAccess, User } from '@eventra/shared';

const API_ROOT = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json();
  if (!response.ok) {
    const error = payload as Partial<ApiErrorBody>;
    throw new ApiError(response.status, error.error?.message ?? 'The request could not be completed');
  }
  return payload as T;
}

export const api = {
  me: () => request<{ user: User }>('/auth/me'),
  login: (email: string, password: string) => request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  socialLogin: (provider: 'google' | 'github') => request<{ user: User }>('/auth/social', { method: 'POST', body: JSON.stringify({ provider }) }),
  requestPasswordReset: (email: string) => request<{ message: string }>('/auth/password-reset', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  events: (params: { q?: string; category?: string; city?: string; pageSize?: number } = {}) => request<Paginated<EventSummary>>(`/events?${new URLSearchParams(cleanParams(params))}`),
  movies: (query?: string) => request<{ data: Movie[]; source: 'tmdb' | 'demo' }>(`/movies${query ? `?${new URLSearchParams({ q: query })}` : ''}`),
  event: (id: string) => request<EventDetails>(`/events/${id}`),
  createEvent: (input: CreateEventInput) => request<EventDetails>('/events', { method: 'POST', body: JSON.stringify(input) }),
  hold: (eventId: string, items: Array<{ ticketTypeId: string; quantity: number }>) => request<{ id: string; eventId: string; items: BookingItem[]; expiresAt: string }>(`/bookings/hold`, { method: 'POST', body: JSON.stringify({ eventId, items }) }),
  createPayment: (holdId: string, idempotencyKey: string) => request<PaymentIntent>(`/payments/create`, { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify({ holdId }) }),
  verifyPayment: (paymentId: string) => request<Booking>(`/payments/verify`, { method: 'POST', body: JSON.stringify({ paymentId }) }),
  bookings: () => request<{ data: Booking[] }>('/bookings'),
  ticket: (id: string) => request<TicketAccess>(`/tickets/${id}`),
  validateTicket: (token: string) => request<Booking['tickets'][number]>(`/tickets/validate`, { method: 'POST', body: JSON.stringify({ token }) }),
  organizerEvents: () => request<{ data: EventSummary[] }>('/organizer/events'),
  publishEvent: (id: string) => request<EventSummary>(`/events/${id}/publish`, { method: 'POST' }),
  adminSummary: () => request<AdminSummary>('/admin/summary'),
  adminEvents: () => request<{ data: EventSummary[] }>('/admin/events'),
  help: (message: string) => request<{ reply: string }>('/help', { method: 'POST', body: JSON.stringify({ message }) }),
};

function cleanParams(params: Record<string, string | number | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string | number] => entry[1] !== undefined).map(([key, value]) => [key, String(value)]));
}
