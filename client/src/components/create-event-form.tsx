import { useState, type FormEvent } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';
import type { CreateEventInput, EventDetails } from '@eventra/shared';
import { api, ApiError } from '../api';

type FormState = {
  title: string;
  slug: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  address: string;
  imageUrl: string;
  description: string;
  ticketName: string;
  ticketDescription: string;
  price: string;
  capacity: string;
  tags: string;
  refundPolicy: string;
};

const initialState: FormState = {
  title: '', slug: '', category: 'Music', date: '', time: '', venue: '', city: '', address: '',
  imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
  description: '', ticketName: 'General Admission', ticketDescription: 'Entry to the full event programme.', price: '48', capacity: '300', tags: 'live, community', refundPolicy: 'Full refund up to 7 days before the event.',
};

export default function CreateEventForm({ onCreated, onClose }: { onCreated: (event: EventDetails) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof FormState, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const input: CreateEventInput = {
      title: form.title,
      slug: form.slug,
      category: form.category,
      date: form.date,
      time: form.time,
      venue: form.venue,
      city: form.city,
      address: form.address,
      imageUrl: form.imageUrl,
      accent: '#c6f36b',
      description: form.description,
      ticketTypes: [{ name: form.ticketName, description: form.ticketDescription, price: Number(form.price), currency: 'USD', capacity: Number(form.capacity) }],
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      refundPolicy: form.refundPolicy,
      faqs: [],
    };
    try {
      onCreated(await api.createEvent(input));
      setForm(initialState);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The event could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="form-modal-backdrop" role="presentation" onClick={onClose}>
    <section className="create-event-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title" onClick={event => event.stopPropagation()}>
      <div className="modal-heading"><div><p className="eyebrow">Organizer studio</p><h2 id="create-event-title">Create an event</h2></div><button className="icon-button" aria-label="Close create event form" onClick={onClose}><X size={18} /></button></div>
      <form className="create-event-form" onSubmit={submit}>
        <div className="create-event-grid"><label>Event title<input value={form.title} onChange={event => update('title', event.target.value)} required minLength={3} /></label><label>URL slug<input value={form.slug} onChange={event => update('slug', event.target.value)} placeholder="summer-sessions" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label><label>Category<select value={form.category} onChange={event => update('category', event.target.value)}><option>Music</option><option>Conference</option><option>Culture</option><option>Workshop</option></select></label><label>Date<input type="date" value={form.date} onChange={event => update('date', event.target.value)} required /></label><label>Time<input value={form.time} onChange={event => update('time', event.target.value)} placeholder="8:00 PM" required /></label><label>Venue<input value={form.venue} onChange={event => update('venue', event.target.value)} required /></label><label>City<input value={form.city} onChange={event => update('city', event.target.value)} placeholder="Austin, TX" required /></label><label>Address<input value={form.address} onChange={event => update('address', event.target.value)} required /></label></div>
        <label>Event image URL<input type="url" value={form.imageUrl} onChange={event => update('imageUrl', event.target.value)} required /></label>
        <label>Description<textarea value={form.description} onChange={event => update('description', event.target.value)} minLength={20} rows={3} required /></label>
        <div className="create-event-grid"><label>Ticket type<input value={form.ticketName} onChange={event => update('ticketName', event.target.value)} required /></label><label>Ticket description<input value={form.ticketDescription} onChange={event => update('ticketDescription', event.target.value)} required /></label><label>Price (USD)<input type="number" min="0" step="1" value={form.price} onChange={event => update('price', event.target.value)} required /></label><label>Capacity<input type="number" min="1" step="1" value={form.capacity} onChange={event => update('capacity', event.target.value)} required /></label></div>
        <div className="create-event-grid"><label>Tags <span className="field-hint">comma separated</span><input value={form.tags} onChange={event => update('tags', event.target.value)} /></label><label>Refund policy<input value={form.refundPolicy} onChange={event => update('refundPolicy', event.target.value)} required /></label></div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Submit for review'} <ArrowRight size={16} /></button></div>
      </form>
    </section>
  </div>;
}
