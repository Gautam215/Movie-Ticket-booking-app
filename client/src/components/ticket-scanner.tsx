import { useState, type FormEvent } from 'react';
import { CheckCircle2, ScanLine, ShieldCheck, XCircle } from 'lucide-react';
import type { Ticket } from '@eventra/shared';
import { api, ApiError } from '../api';

export default function TicketScanner() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim() || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await api.validateTicket(token.trim()));
      setToken('');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The ticket could not be validated.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="section page-gutter scanner-page">
    <div className="scanner-hero"><div><p className="eyebrow"><span className="eyebrow-dot" />Entry operations</p><h1>Validate<br /><em>tickets.</em></h1><p className="intro-copy">Use a hardware QR scanner or paste the secure ticket token to admit attendees.</p></div><div className="scanner-hero-mark"><ScanLine size={28} /><span>LIVE<br />CHECK-IN</span></div></div>
    <div className="scanner-layout">
      <form className="scanner-card" onSubmit={submit}>
        <div className="scanner-card-heading"><span className="ticket-icon"><ScanLine size={19} /></span><div><p className="eyebrow">Secure validation</p><h2>Scan a ticket</h2></div></div>
        <label className="scanner-input-label" htmlFor="ticket-token">Ticket token</label>
        <input id="ticket-token" className="scanner-input" value={token} onChange={event => setToken(event.target.value)} placeholder="Paste or scan token" autoComplete="off" autoFocus />
        <button className="button button-primary full-width" disabled={busy || !token.trim()}>{busy ? 'Checking ticket...' : 'Validate entry'} <ShieldCheck size={16} /></button>
        <p className="checkout-note"><ShieldCheck size={13} /> One-time server validation · Duplicate scans are blocked</p>
        {error && <div className="scanner-result scanner-result-error"><XCircle size={22} /><div><strong>Entry denied</strong><span>{error}</span></div></div>}
        {result && <div className="scanner-result scanner-result-success"><CheckCircle2 size={22} /><div><strong>Entry approved</strong><span>{result.attendeeName} · {result.ticketName}</span><small>{result.eventTitle}</small></div></div>}
      </form>
      <aside className="scanner-aside"><p className="eyebrow">Operator notes</p><ul><li>Ask the attendee to raise screen brightness before scanning.</li><li>Each ticket can be redeemed once only.</li><li>Organizer validation is scoped to their own events.</li></ul></aside>
    </div>
  </section>;
}
