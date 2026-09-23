import { CheckCircle2, Eye, Fingerprint, MoveRight, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react';
import type { EventSummary } from '@eventra/shared';
import { cn } from '@/lib/utils';

const fallbackEvent = {
  title: 'Neon Nights: After Dark',
  city: 'Austin, TX',
  date: '2026-10-18',
  time: '8:00 PM',
  category: 'Music',
  imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
};

type GlassmorphismTrustHeroProps = {
  events?: EventSummary[];
  onExplore: () => void;
  onOpenEvent?: (id: string) => void;
};

export default function GlassmorphismTrustHero({ events = [], onExplore, onOpenEvent }: GlassmorphismTrustHeroProps) {
  const featured = events[0];
  const event = featured ?? fallbackEvent;
  const eventDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(`${event.date}T12:00:00`));

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-ink-950)] text-[var(--color-paper-50)]">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[var(--color-lime-400)]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[-7rem] h-[28rem] w-[28rem] rounded-full bg-[var(--color-cyan-300)]/10 blur-3xl" />
      <div className="page-gutter relative mx-auto max-w-[1500px] pb-14 pt-10 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,.9fr)_minmax(480px,1.1fr)] lg:gap-16">
          <div className="relative z-10 max-w-[600px]">
            <p className="eyebrow flex items-center gap-2"><span className="eyebrow-dot !mr-0" />Eventra / event marketplace</p>
            <h1 className="mt-6 max-w-[680px] text-[clamp(3.5rem,8vw,8.25rem)] font-semibold leading-[.84] tracking-[-.08em]">
              Discover events.<br /><em className="font-[var(--font-display)] font-semibold not-italic text-[var(--color-lime-400)]">Reserve tickets.</em>
            </h1>
            <p className="mt-8 max-w-[410px] text-base leading-7 text-[var(--color-paper-300)] sm:text-lg">
              Event discovery, ticket reservation, server-verified checkout, and digital QR ticket access in one flow.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button className="button button-primary" onClick={onExplore}>
                Explore events <MoveRight size={17} />
              </button>
              <span className="inline-flex items-center gap-2 font-[var(--font-mono)] text-[10px] uppercase tracking-[.12em] text-[var(--color-paper-300)]">
                <ShieldCheck size={14} className="text-[var(--color-cyan-300)]" /> Server-verified checkout
              </span>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.12em] text-[var(--color-paper-300)]">
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--color-lime-400)]" /> Secure registration</span>
              <span className="inline-flex items-center gap-2"><Zap size={14} className="text-[var(--color-cyan-300)]" /> Ticket reservation</span>
              <span className="inline-flex items-center gap-2"><Fingerprint size={14} className="text-[var(--color-coral-400)]" /> Digital QR tickets</span>
            </div>
          </div>

          <div className="relative min-h-[430px] sm:min-h-[520px]">
            <div className="absolute inset-x-4 top-8 h-[390px] rounded-[2rem] border border-[var(--color-cyan-300)]/20 bg-[linear-gradient(135deg,rgba(112,217,255,.12),transparent_48%,rgba(198,243,107,.08))] shadow-[0_25px_100px_rgba(0,0,0,.22)] backdrop-blur-3xl sm:inset-x-12 sm:top-10 sm:h-[450px]" />
            <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(198,243,107,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(198,243,107,.1)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(90deg,transparent,black_24%,black_78%,transparent)]" />

            <button
              className={cn(
                'group absolute left-[7%] top-[8%] z-10 w-[72%] -rotate-6 overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-left shadow-[0_35px_80px_rgba(0,0,0,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:rotate-[-4deg] focus-visible:outline-none sm:left-[14%] sm:top-[9%] sm:w-[62%]',
                !onOpenEvent && 'cursor-default',
              )}
              onClick={() => featured && onOpenEvent?.(featured.id)}
              aria-label={featured ? `Open ${featured.title}` : undefined}
            >
              <div className="relative aspect-[1.14] overflow-hidden">
                <img src={event.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(16,24,32,.9)_100%)]" />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between font-[var(--font-mono)] text-[9px] uppercase tracking-[.14em] text-white/75">
                  <span>Event details</span><Sparkles size={14} />
                </div>
                <div className="absolute inset-x-5 bottom-5">
                  <p className="font-[var(--font-mono)] text-[9px] uppercase tracking-[.15em] text-[var(--color-lime-400)]">{event.category} · {eventDate}</p>
                  <strong className="mt-2 block max-w-[260px] text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-[.82] tracking-[-.08em] text-white">{event.title}</strong>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 font-[var(--font-mono)] text-[9px] uppercase tracking-[.1em] text-white/65">
                <span>{event.city} · {event.time}</span><MoveRight size={16} className="text-[var(--color-lime-400)]" />
              </div>
            </button>

            <div className="absolute right-0 top-[14%] z-20 w-[42%] rotate-[9deg] rounded-2xl border border-white/20 p-5 text-[var(--color-ink-950)] shadow-[0_25px_55px_rgba(0,0,0,.25)] backdrop-blur-xl sm:right-[5%] sm:w-[34%]" style={{ backgroundColor: 'rgba(255, 141, 122, .92)' }}>
              <div className="flex items-start justify-between"><Star size={17} fill="currentColor" /><span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[.1em]">Event marketplace</span></div>
              <strong className="mt-12 block text-3xl font-semibold leading-[.9] tracking-[-.08em] sm:text-4xl">Discover<br />events.</strong>
              <div className="mt-7 flex items-center gap-2 border-t border-[var(--color-ink-950)]/20 pt-3 font-[var(--font-mono)] text-[9px] uppercase tracking-[.08em]"><Eye size={13} /> Searchable discovery</div>
            </div>

            <div className="absolute bottom-[5%] right-[2%] z-20 w-[55%] rounded-2xl border border-white/15 bg-[var(--color-ink-900)]/70 p-4 shadow-[0_24px_60px_rgba(0,0,0,.3)] backdrop-blur-2xl sm:bottom-[6%] sm:right-[8%] sm:w-[42%]">
              <div className="flex items-center justify-between"><span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[.1em] text-[var(--color-paper-300)]">QR ticket access</span><span className="h-2 w-2 rounded-full bg-[var(--color-lime-400)] shadow-[0_0_14px_var(--color-lime-400)]" /></div>
              <div className="mt-3 flex items-end justify-between gap-3"><div><strong className="block text-2xl tracking-[-.08em]">QR</strong><span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[.08em] text-[var(--color-paper-300)]">Digital ticket</span></div><div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[var(--color-ink-950)]"><Fingerprint size={22} /></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
