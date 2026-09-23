import { useState } from 'react';
import { CheckCircle2, ExternalLink, LoaderCircle, ScanLine, X } from 'lucide-react';
import type { Booking, TicketAccess } from '@eventra/shared';
import { api, ApiError } from '../api';

export default function TicketWallet({ booking }: { booking: Booking }) {
  const [ticketAccess, setTicketAccess] = useState<TicketAccess | null>(null);
  const [busyTicketId, setBusyTicketId] = useState('');
  const [error, setError] = useState('');

  async function openTicket(ticketId: string) {
    setBusyTicketId(ticketId);
    setError('');
    try {
      setTicketAccess(await api.ticket(ticketId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The ticket could not be loaded.');
    } finally {
      setBusyTicketId('');
    }
  }

  return <>
    <div className="ticket-wallet">
      {booking.tickets.map(ticket => <div className="ticket-row" key={ticket.id}>
        <div className="ticket-row-icon"><ScanLine size={20} /></div>
        <div><strong>{ticket.ticketName}</strong><span>{ticket.attendeeName}</span></div>
        <span className={`ticket-status ${ticket.redeemedAt ? 'is-redeemed' : ''}`}>
          {ticket.redeemedAt ? <><CheckCircle2 size={13} /> Redeemed</> : 'Ready'}
        </span>
        <button className="button button-small ticket-view-button" onClick={() => void openTicket(ticket.id)} disabled={busyTicketId === ticket.id}>
          {busyTicketId === ticket.id ? <LoaderCircle className="spin" size={14} /> : 'View QR'}
        </button>
      </div>)}
    </div>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {ticketAccess && <div className="ticket-modal-backdrop" role="presentation" onClick={() => setTicketAccess(null)}>
      <section className="ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title" onClick={event => event.stopPropagation()}>
        <button className="ticket-modal-close" aria-label="Close ticket" onClick={() => setTicketAccess(null)}><X size={18} /></button>
        <p className="eyebrow">Digital ticket</p>
        <h2 id="ticket-modal-title">{ticketAccess.ticket.ticketName}</h2>
        <p className="ticket-modal-event">{ticketAccess.ticket.eventTitle}</p>
        <img className="ticket-qr" src={ticketAccess.qrDataUrl} alt={`QR code for ${ticketAccess.ticket.ticketName}`} />
        <div className="ticket-modal-meta"><span>{ticketAccess.ticket.date}</span><span>{ticketAccess.ticket.venue}</span></div>
        <p className="ticket-token-full">Scan token · {ticketAccess.ticket.validationToken}</p>
        <a className="ticket-print-link" href={ticketAccess.qrDataUrl} download={`${ticketAccess.ticket.ticketName.toLowerCase().split(' ').join('-')}-qr.png`}><ExternalLink size={14} /> Download QR</a>
      </section>
    </div>}
  </>;
}
