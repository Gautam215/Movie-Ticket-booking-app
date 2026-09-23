import { AlertCircle, Copy, RotateCcw, Send, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { Action, Actions } from './ui/ai-actions';

type HelpMessage = { id: number; from: 'user' | 'assistant'; content: string; prompt?: string };

const quickPrompts = ['Find events', 'Reserve tickets', 'Digital QR tickets'];

export default function HelpSection() {
  const [messages, setMessages] = useState<HelpMessage[]>([{ id: 1, from: 'assistant', content: 'Ask about event discovery, ticket reservation, server-verified checkout, digital QR tickets, or venue validation.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function ask(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    const id = Date.now();
    setInput('');
    setError('');
    setMessages(current => [...current, { id, from: 'user', content: trimmed }, { id: id + 1, from: 'assistant', content: 'Loading...', prompt: trimmed }]);
    setBusy(true);
    try {
      const result = await api.help(trimmed);
      setMessages(current => current.map(item => item.id === id + 1 ? { ...item, content: result.reply } : item));
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : 'The help service is unavailable.';
      setMessages(current => current.filter(item => item.id !== id + 1));
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  async function copyMessage(id: number, content: string) {
    await navigator.clipboard?.writeText(content);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(current => current === id ? null : current), 1400);
  }

  async function shareMessage(content: string) {
    if (navigator.share) await navigator.share({ text: content });
    else await navigator.clipboard?.writeText(content);
  }

  return <section className="section page-gutter help-section" id="help">
    <div className="help-heading"><div><p className="eyebrow">Eventra help</p><h2>Ask about <em>Eventra.</em></h2></div><p>Get help with the event marketplace, ticket reservation, checkout, QR tickets, and venue validation.</p></div>
    <div className="help-layout">
      <div className="help-card">
        <div className="help-messages" aria-live="polite">{messages.map(message => <div className={`help-message help-message-${message.from}`} key={message.id}><div className="help-message-label">{message.from === 'assistant' ? 'Eventra help' : 'You'}</div><p>{message.content}</p>{message.from === 'assistant' && message.content !== 'Loading...' && <Actions className="help-actions"><Action label={copiedId === message.id ? 'Copied' : 'Copy'} onClick={() => void copyMessage(message.id, message.content)}><Copy size={14} /></Action><Action label="Retry" disabled={!message.prompt || busy} onClick={() => void ask(message.prompt ?? '')}><RotateCcw size={14} /></Action><Action label="Like"><ThumbsUp size={14} /></Action><Action label="Dislike"><ThumbsDown size={14} /></Action><Action label="Share" onClick={() => void shareMessage(message.content)}><Share2 size={14} /></Action></Actions>}</div>)}</div>
        {error && <p className="help-error" role="alert"><AlertCircle size={15} />{error}</p>}
        <div className="help-prompts">{quickPrompts.map(prompt => <button key={prompt} onClick={() => void ask(prompt)} disabled={busy}>{prompt}</button>)}</div>
        <form className="help-form" onSubmit={submit}><label className="sr-only" htmlFor="eventra-help-input">Ask Eventra help</label><input id="eventra-help-input" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question about Eventra" disabled={busy} /><button className="button button-primary" type="submit" disabled={busy || !input.trim()} aria-label="Send question"><Send size={16} /></button></form>
      </div>
      <aside className="help-aside"><p className="eyebrow">Supported topics</p><ul><li>Event discovery and event details</li><li>Ticket quantity and reservation</li><li>Server-verified checkout</li><li>Digital QR tickets</li><li>Venue validation</li></ul></aside>
    </div>
  </section>;
}
