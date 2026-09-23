import { CheckCircle2, Clock3, Eye, ShieldCheck } from 'lucide-react';
import type { EventSummary } from '@eventra/shared';

export default function AdminReview({ events, onPublish }: { events: EventSummary[]; onPublish: (id: string) => Promise<void> }) {
  const pending = events.filter(event => event.status === 'pending_review');
  return <div className="admin-review-card">
    <div className="panel-heading"><div><p className="eyebrow">Moderation queue</p><h2>Event review</h2></div><span className="muted-label">{pending.length} pending</span></div>
    <div className="admin-review-list">{events.map(event => <div className="admin-review-row" key={event.id}><span className="event-table-image" style={{ backgroundImage: `url(${event.imageUrl})` }} /><div className="admin-review-copy"><strong>{event.title}</strong><span>{event.category} · {event.city}</span></div><span className={`status-pill status-${event.status}`}>{event.status.replace('_', ' ')}</span>{event.status === 'pending_review' ? <button className="button button-small" onClick={() => void onPublish(event.id)}><CheckCircle2 size={14} /> Approve</button> : <span className="admin-review-live"><Eye size={14} /> Live</span>}</div>)}</div>
    {!events.length && <div className="dashboard-empty"><Clock3 size={22} /><h3>No event listings yet.</h3><p>New organizer submissions will appear here.</p></div>}
    <div className="admin-review-note"><ShieldCheck size={15} /> Publishing exposes the event to public discovery and makes its inventory available for holds.</div>
  </div>;
}
