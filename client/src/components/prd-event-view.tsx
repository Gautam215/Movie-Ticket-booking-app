import { ArrowRight, CalendarDays, Clock3, LockKeyhole, MapPin, Minus, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import type { Booking, EventDetails, User } from '@eventra/shared';
import { api } from '../api';

type PrdEventViewProps = {
  event: EventDetails;
  user: User | null;
  onBack: () => void;
  onAuth: () => void;
  onComplete: (booking: Booking) => void;
};

export default function PrdEventView({ event, user, onBack, onAuth, onComplete }: PrdEventViewProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hold, setHold] = useState<{ id: string; expiresAt: string } | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [error, setError] = useState('');
  const total = event.ticketTypes.reduce((sum, ticket) => sum + ticket.price * (quantities[ticket.id] ?? 0), 0);
  const count = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);

  function changeQuantity(id: string, delta: number) {
    setQuantities(current => {
      const ticket = event.ticketTypes.find(item => item.id === id);
      return { ...current, [id]: Math.max(0, Math.min(ticket?.available ?? 8, (current[id] ?? 0) + delta)) };
    });
  }

  async function reserve() {
    if (!user) { onAuth(); return; }
    if (!count) { setError('Select a ticket quantity.'); return; }
    setError('');
    try {
      const result = await api.hold(event.id, Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })));
      setHold({ id: result.id, expiresAt: result.expiresAt });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The ticket hold could not be created.');
    }
  }

  async function pay() {
    if (!hold) return;
    setPaymentBusy(true);
    setError('');
    try {
      const payment = await api.createPayment(hold.id, `demo:${hold.id}`);
      onComplete(await api.verifyPayment(payment.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Payment verification failed.');
    } finally {
      setPaymentBusy(false);
    }
  }

  return <section className="section page-gutter event-page">
    <button className="back-link" onClick={onBack}><ArrowRight size={16} className="back-arrow" /> Back to events</button>
    <div className="event-hero">
      <div className="event-hero-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 40%, #111923 100%), url(${event.imageUrl})` }}><span className="event-category">{event.category}</span></div>
      <div className="event-hero-copy"><p className="eyebrow">Event details</p><h1>{event.title}</h1><p className="event-description">{event.description}</p><div className="event-meta"><span><CalendarDays size={16} />{formatLongDate(event.date)}</span><span><Clock3 size={16} />{event.time}</span><span><MapPin size={16} />{event.venue}, {event.city}</span></div><div className="event-tags">{event.tags.map(tag => <span key={tag}>#{tag}</span>)}</div></div>
    </div>
    <div className="event-content-grid">
      <div><div className="section-heading compact"><div><p className="eyebrow">Ticket quantity</p><h2>Tickets</h2></div><span className="muted-label">{event.organizer.name}</span></div><div className="ticket-options">{event.ticketTypes.map(ticket => <div className="ticket-option" key={ticket.id}><div><h3>{ticket.name}</h3><p>{ticket.description}</p><span className="availability">{ticket.available} remaining</span></div><div className="ticket-pick"><strong>${ticket.price}</strong><div className="stepper"><button aria-label={`Remove one ${ticket.name}`} onClick={() => changeQuantity(ticket.id, -1)}><Minus size={14} /></button><span>{quantities[ticket.id] ?? 0}</span><button aria-label={`Add one ${ticket.name}`} onClick={() => changeQuantity(ticket.id, 1)}><Plus size={14} /></button></div></div></div>)}</div></div>
      <aside className="checkout-card"><div className="checkout-heading"><span className="ticket-icon"><Ticket size={18} /></span><div><p className="eyebrow">Checkout</p><h2>{hold ? 'Hold secured' : 'Reserve tickets'}</h2></div></div>{hold ? <div className="hold-message"><span className="hold-pulse" /> Tickets held until {new Date(hold.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div> : <div className="checkout-empty">Select tickets to create an expiring inventory hold before payment.</div>}<div className="checkout-line"><span>Total</span><strong>${total.toFixed(2)}</strong></div>{error && <p className="inline-error" role="alert">{error}</p>}<button className="button button-primary full-width" onClick={hold ? pay : reserve} disabled={paymentBusy}>{paymentBusy ? 'Verifying...' : hold ? 'Verify payment' : 'Reserve tickets'} <ArrowRight size={17} /></button><div className="checkout-note"><LockKeyhole size={13} /> Server-verified checkout · Digital QR tickets</div></aside>
    </div>
  </section>;
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
