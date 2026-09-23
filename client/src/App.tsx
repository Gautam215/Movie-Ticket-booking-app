import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Clock3, Compass, Eye, EyeOff, Filter, Github, LayoutDashboard, LockKeyhole, MapPin, Menu, Minus, Moon, Plus, RefreshCcw, ScanLine, Search, ShieldCheck, Sparkles, Sun, Ticket, UsersRound, X } from 'lucide-react';
import type { AdminSummary, Booking, EventDetails, EventSummary, Movie, User } from '@eventra/shared';
import { api, ApiError } from './api';
import MovieReel from './components/ui/movie-reel';
import BlackHole from './components/ui/black-hole';
import PrdEventView from './components/prd-event-view';
import HelpSection from './components/help-section';
import TicketWallet from './components/ticket-wallet';
import TicketScanner from './components/ticket-scanner';
import CreateEventForm from './components/create-event-form';
import AdminReview from './components/admin-review';
import { signInWithGoogle, signOutFromFirebase } from './lib/firebase';

type View = 'home' | 'discover' | 'event' | 'auth' | 'dashboard' | 'organizer' | 'scanner' | 'admin';
type AuthMode = 'login' | 'register';
type Theme = 'dark' | 'light';

const categories = ['All', 'Music', 'Conference', 'Culture'];

export default function App() {
  const [view, setView] = useState<View>('home');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [organizerEvents, setOrganizerEvents] = useState<EventSummary[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [adminEvents, setAdminEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [organizerLoading, setOrganizerLoading] = useState(false);
  const [organizerError, setOrganizerError] = useState('');

  useEffect(() => {
    void Promise.all([
      api.events({ pageSize: 12 }).then(result => setEvents(result.data)),
      api.movies().then(result => setMovies(result.data)),
      api.me().then(result => setUser(result.user)).catch(() => undefined),
    ]).catch(error => setMessage(errorMessage(error))).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'dashboard' && user) void api.bookings().then(result => setBookings(result.data)).catch(error => setMessage(errorMessage(error)));
    if (view === 'organizer' && user) refreshOrganizer();
    if (view === 'admin' && user) void Promise.all([api.adminSummary().then(setAdminSummary), api.adminEvents().then(result => setAdminEvents(result.data))]).catch(error => setMessage(errorMessage(error)));
  }, [view, user]);

  function navigate(nextView: View) {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openEvent(id: string) {
    setMessage('');
    try {
      setSelectedEvent(await api.event(id));
      navigate('event');
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  function requireUser(nextView: View) {
    if (!user) {
      navigate('auth');
      return;
    }
    navigate(nextView);
  }

  async function signOut() {
    await Promise.all([api.logout().catch(() => undefined), signOutFromFirebase().catch(() => undefined)]);
    setUser(null);
    navigate('home');
    setMessage('You are signed out.');
  }

  function refreshOrganizer() {
    if (!user) return;
    setOrganizerLoading(true);
    setOrganizerError('');
    void api.organizerEvents().then(result => setOrganizerEvents(result.data)).catch(error => { const message = errorMessage(error); setOrganizerError(message); setMessage(message); }).finally(() => setOrganizerLoading(false));
  }

  if (loading) return <div className="app-loading"><BlackHole /><div className="app-loading-content"><div className="loader-orbit" /><p>Loading events...</p></div></div>;

  return (
    <div className={`app-shell ${view === 'auth' ? 'auth-shell' : ''}`} data-theme={theme}>
       <BlackHole />
       {view !== 'auth' && <Header user={user} theme={theme} menuOpen={menuOpen} onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} onMenu={() => setMenuOpen(open => !open)} onNavigate={navigate} onRequireUser={requireUser} onSignOut={signOut} />}
      <main>
        {message && <div className="toast" role="status"><Sparkles size={16} />{message}<button aria-label="Dismiss message" onClick={() => setMessage('')}><X size={15} /></button></div>}
        {view === 'home' && <HomeView events={events} movies={movies} onDiscover={() => navigate('discover')} onOpenEvent={openEvent} />}
        {view === 'discover' && <DiscoverView events={events} movies={movies} onOpenEvent={openEvent} />}
        {view === 'event' && selectedEvent && <PrdEventView event={selectedEvent} user={user} onBack={() => navigate('discover')} onAuth={() => navigate('auth')} onComplete={booking => { setBookings(current => [booking, ...current]); navigate('dashboard'); setMessage(`Booking ${booking.reference} is confirmed.`); }} />}
        {view === 'auth' && <AuthView onBack={() => navigate('home')} onSuccess={nextUser => { setUser(nextUser); navigate('dashboard'); setMessage(`Welcome, ${nextUser.name.split(' ')[0]}.`); }} />}
        {view === 'dashboard' && user && <DashboardView user={user} bookings={bookings} onExplore={() => navigate('discover')} />}
        {view === 'organizer' && user && <OrganizerView events={organizerEvents} loading={organizerLoading} error={organizerError} onRetry={refreshOrganizer} onCreate={event => { setOrganizerEvents(current => [toSummary(event), ...current]); setMessage('Event submitted for review.'); }} onPublish={async id => { try { const event = await api.publishEvent(id); setOrganizerEvents(current => current.map(item => item.id === id ? event : item)); setMessage('Event published.'); } catch (error) { setMessage(errorMessage(error)); } }} />}
        {view === 'scanner' && user && <TicketScanner />}
        {view === 'admin' && user && <AdminView summary={adminSummary} events={adminEvents} onPublish={async id => { try { const event = await api.publishEvent(id); setAdminEvents(current => current.map(item => item.id === id ? event : item)); setAdminSummary(current => current ? { ...current, pendingEvents: Math.max(0, current.pendingEvents - 1), publishedEvents: current.publishedEvents + 1 } : current); setMessage('Event approved and published.'); } catch (error) { setMessage(errorMessage(error)); } }} />}
      </main>
       {view !== 'auth' && <Footer />}
    </div>
  );
}

function Header({ user, theme, menuOpen, onToggleTheme, onMenu, onNavigate, onRequireUser, onSignOut }: { user: User | null; theme: Theme; menuOpen: boolean; onToggleTheme: () => void; onMenu: () => void; onNavigate: (view: View) => void; onRequireUser: (view: View) => void; onSignOut: () => void }) {
  return <header className="site-header">
    <button className="brand" onClick={() => onNavigate('home')} aria-label="Eventra home"><span className="brand-mark">E</span><span>eventra<span className="brand-dot">.</span></span></button>
    <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
      <button onClick={() => onNavigate('discover')}><Compass size={16} /> Discover</button>
      {user && <button onClick={() => onRequireUser('dashboard')}><LayoutDashboard size={16} /> My tickets</button>}
      {user && ['organizer', 'admin'].includes(user.role) && <button onClick={() => onRequireUser('organizer')}><UsersRound size={16} /> Studio</button>}
      {user && ['staff', 'organizer', 'admin'].includes(user.role) && <button onClick={() => onRequireUser('scanner')}><ScanLine size={16} /> Scanner</button>}
      {user?.role === 'admin' && <button onClick={() => onRequireUser('admin')}><ShieldCheck size={16} /> Admin</button>}
    </nav>
    <div className="header-actions">
      <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      {user ? <button className="user-chip" onClick={() => onRequireUser('dashboard')}><span>{initials(user.name)}</span>{user.name.split(' ')[0]}</button> : <button className="button button-quiet" onClick={() => onNavigate('auth')}>Sign in</button>}
      {user && <button className="button button-quiet desktop-only" onClick={onSignOut}>Sign out</button>}
      <button className="menu-button" onClick={onMenu} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
  </header>;
}

function HomeView({ events, movies, onDiscover, onOpenEvent }: { events: EventSummary[]; movies: Movie[]; onDiscover: () => void; onOpenEvent: (id: string) => void }) {
  const featured = events.filter(event => event.featured);
  return <>
    <MovieReel movies={movies} onExplore={onDiscover} />
    <section className="signal-strip"><span>EVENT DISCOVERY</span><span>✦</span><span>TICKET RESERVATION</span><span>✦</span><span>QR TICKET ACCESS</span></section>
    <section className="section page-gutter featured-section"><div className="section-heading"><div><p className="eyebrow">Event discovery</p><h2>Searchable events.<br /><em>Event details.</em></h2></div><button className="text-link" onClick={onDiscover}>See all events <ChevronRight size={16} /></button></div><div className="event-grid">{featured.map(event => <EventCard key={event.id} event={event} onOpen={onOpenEvent} />)}</div></section>
    <section className="manifesto page-gutter"><div className="manifesto-number">01</div><div><p className="eyebrow">MVP flow</p><h2>Reserve tickets.<br /><em>Access QR tickets.</em></h2></div><p>Select ticket quantities, complete server-verified checkout, and access digital QR tickets.</p></section>
    <HelpSection />
  </>;
}

function DiscoverView({ events, movies, onOpenEvent }: { events: EventSummary[]; movies: Movie[]; onOpenEvent: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const filtered = events.filter(event => {
    const matchesQuery = `${event.title} ${event.city} ${event.venue}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === 'All' || event.category === category);
  });
   return <><MovieReel movies={movies} onExplore={() => document.querySelector('.discover-page')?.scrollIntoView({ behavior: 'smooth' })} /><section className="section page-gutter discover-page"><div className="page-intro"><div><p className="eyebrow">Event discovery</p><h1>Discover <em>events.</em></h1></div><p className="intro-copy">Search events and view event details.</p></div><div className="filter-row"><label className="search-field"><Search size={17} /><span className="sr-only">Search events</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search city, venue, or event" /></label><div className="category-tabs" role="tablist">{categories.map(item => <button key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div>{filtered.length ? <div className="event-grid event-grid-wide">{filtered.map(event => <EventCard key={event.id} event={event} onOpen={onOpenEvent} />)}</div> : <div className="empty-state"><Compass size={28} /><h2>No events found.</h2><p>Try a different search or clear the filters.</p><button className="button button-secondary" onClick={() => { setQuery(''); setCategory('All'); }}>Reset filters</button></div>}</section></>;
}

function EventCard({ event, onOpen }: { event: EventSummary; onOpen: (id: string) => void }) {
  return <button className="event-card" onClick={() => onOpen(event.id)}><div className="event-image" style={{ backgroundImage: `linear-gradient(145deg, ${event.accent}33, transparent 60%), url(${event.imageUrl})` }}><span className="event-category">{event.category}</span><span className="event-date">{formatShortDate(event.date)}</span></div><div className="event-card-body"><div><h3>{event.title}</h3><p><MapPin size={13} />{event.city} · {event.venue}</p></div><span className="price-label">From <strong>${event.priceFrom}</strong></span></div></button>;
}

function EventView({ event, user, onBack, onAuth, onComplete }: { event: EventDetails; user: User | null; onBack: () => void; onAuth: () => void; onComplete: (booking: Booking) => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hold, setHold] = useState<{ id: string; expiresAt: string } | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [error, setError] = useState('');
  const total = event.ticketTypes.reduce((sum, ticket) => sum + ticket.price * (quantities[ticket.id] ?? 0), 0);
  const count = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);

  function changeQuantity(id: string, delta: number) {
    setQuantities(current => {
      const ticket = event.ticketTypes.find(item => item.id === id);
      const next = Math.max(0, Math.min(ticket?.available ?? 8, (current[id] ?? 0) + delta));
      return { ...current, [id]: next };
    });
  }

  async function reserve() {
    if (!user) { onAuth(); return; }
    if (!count) { setError('Choose at least one ticket to continue.'); return; }
    setError('');
    try {
      const result = await api.hold(event.id, Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })));
      setHold({ id: result.id, expiresAt: result.expiresAt });
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function pay() {
    if (!hold) return;
    setPaymentBusy(true);
    setError('');
    try {
      const payment = await api.createPayment(hold.id, `demo:${hold.id}`);
      onComplete(await api.verifyPayment(payment.id));
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setPaymentBusy(false); }
  }

  return <section className="section page-gutter event-page"><button className="back-link" onClick={onBack}><ArrowRight size={16} className="back-arrow" /> Back to events</button><div className="event-hero"><div className="event-hero-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 40%, #111923 100%), url(${event.imageUrl})` }}><span className="event-category">{event.category}</span></div><div className="event-hero-copy"><p className="eyebrow">{event.organizer.verified ? 'Verified organizer' : 'Event listing'}</p><h1>{event.title}</h1><p className="event-description">{event.description}</p><div className="event-meta"><span><CalendarDays size={16} />{formatLongDate(event.date)}</span><span><Clock3 size={16} />{event.time}</span><span><MapPin size={16} />{event.venue}, {event.city}</span></div><div className="event-tags">{event.tags.map(tag => <span key={tag}>#{tag}</span>)}</div></div></div><div className="event-content-grid"><div><div className="section-heading compact"><div><p className="eyebrow">Choose your angle</p><h2>Tickets</h2></div><span className="muted-label">{event.organizer.name} · verified</span></div><div className="ticket-options">{event.ticketTypes.map(ticket => <div className="ticket-option" key={ticket.id}><div><h3>{ticket.name}</h3><p>{ticket.description}</p><span className="availability">{ticket.available} remaining</span></div><div className="ticket-pick"><strong>${ticket.price}</strong><div className="stepper"><button aria-label={`Remove one ${ticket.name}`} onClick={() => changeQuantity(ticket.id, -1)}><Minus size={14} /></button><span>{quantities[ticket.id] ?? 0}</span><button aria-label={`Add one ${ticket.name}`} onClick={() => changeQuantity(ticket.id, 1)}><Plus size={14} /></button></div></div></div>)}</div></div><aside className="checkout-card"><div className="checkout-heading"><span className="ticket-icon"><Ticket size={18} /></span><div><p className="eyebrow">Your night</p><h2>{hold ? 'Hold secured' : 'Build your pass'}</h2></div></div>{hold ? <><div className="hold-message"><span className="hold-pulse" />Tickets are held until {new Date(hold.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div><div className="checkout-line"><span>{count} {count === 1 ? 'ticket' : 'tickets'}</span><strong>${total.toFixed(2)}</strong></div><button className="button button-primary full-width" onClick={() => void pay()} disabled={paymentBusy}>{paymentBusy ? 'Confirming...' : 'Confirm demo payment'} <ArrowRight size={17} /></button><small className="checkout-note"><LockKeyhole size={13} /> Server-verified demo checkout</small></> : <><div className="checkout-empty"><p>Choose a ticket type to unlock your place in the room.</p><div className="checkout-line"><span>{count} selected</span><strong>${total.toFixed(2)}</strong></div></div><button className="button button-primary full-width" onClick={() => void reserve()}>{user ? 'Hold tickets' : 'Sign in to continue'} <ArrowRight size={17} /></button><small className="checkout-note"><LockKeyhole size={13} /> No charge until you confirm</small></>}{error && <p className="inline-error" role="alert">{error}</p>}</aside></div></section>;
}

function AuthView({ onBack, onSuccess }: { onBack: () => void; onSuccess: (user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = mode === 'login' ? await api.login(email, password) : await api.register(name, email, password);
      onSuccess(result.user);
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setBusy(false); }
  }

  async function socialLogin(provider: 'google' | 'github') {
    setBusy(true); setError(''); setNotice('');
    try {
      if (provider === 'google') await signInWithGoogle();
      const result = await api.socialLogin(provider);
      onSuccess(result.user);
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setBusy(false); }
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api.requestPasswordReset(email);
      setNotice(result.message);
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setBusy(false); }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setResetOpen(false);
    setError('');
    setNotice('');
  }

  return <section className="auth-page auth-reference-page">
    <div className="auth-reference-visual" role="img" aria-label="Person wearing a virtual reality headset in a city" >
      <button className="auth-back" type="button" onClick={onBack} aria-label="Back to Eventra home"><ArrowRight size={17} /></button>
    </div>
    <div className="auth-reference-panel">
      <div className="auth-reference-content">
        <div className="auth-reference-heading">
          <h1>{resetOpen ? 'Reset your password' : mode === 'login' ? 'Welcome Back' : 'Create your account'}</h1>
          <p>{resetOpen ? 'Enter your email and we will send reset instructions.' : mode === 'login' ? <>Don't have an account? <button type="button" onClick={() => switchMode('register')}>Sign up</button></> : <>Already have an account? <button type="button" onClick={() => switchMode('login')}>Sign in</button></>}</p>
        </div>

        {resetOpen ? <form className="auth-reference-form" onSubmit={requestReset}>
          <label>Email Address<input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email Address" required /></label>
          {error && <p className="auth-reference-error" role="alert">{error}</p>}
          {notice && <p className="auth-reference-notice" role="status">{notice}</p>}
          <button className="auth-reference-primary" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
          <button className="auth-reference-text-button" type="button" onClick={() => { setResetOpen(false); setError(''); setNotice(''); }}>Back to sign in</button>
        </form> : <>
          <form className="auth-reference-form" onSubmit={submit}>
            {mode === 'register' && <label>Full Name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Full Name" required minLength={2} /></label>}
            <label>Email Address<input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email Address" required /></label>
            <label>Password<div className="auth-password-field"><input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" required minLength={10} /><button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>
            {mode === 'login' && <div className="auth-reference-options"><label className="auth-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Remember me</span></label><button type="button" className="auth-reference-forgot" onClick={() => { setResetOpen(true); setError(''); setNotice(''); }}>Forgot password?</button></div>}
            {error && <p className="auth-reference-error" role="alert">{error}</p>}
            {notice && <p className="auth-reference-notice" role="status">{notice}</p>}
            <button className="auth-reference-primary" type="submit" disabled={busy}>{busy ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <div className="auth-reference-divider" aria-hidden="true"><span>or</span></div>
          <div className="auth-reference-socials">
            <button type="button" onClick={() => void socialLogin('google')} disabled={busy}><span className="auth-google-mark">G</span><span>Continue with<br />Google</span></button>
            <button type="button" onClick={() => void socialLogin('github')} disabled={busy}><Github size={15} /><span>Continue with<br />GitHub</span></button>
          </div>
        </>}
      </div>
    </div>
  </section>;
}

function DashboardView({ user, bookings, onExplore }: { user: User; bookings: Booking[]; onExplore: () => void }) {
  return <section className="section page-gutter dashboard-page" id="dashboard">
    <div className="dashboard-background-design" aria-hidden="true"><div className="responsive-hero-orbit" /><div className="responsive-hero-glow" /></div>
    <div className="dashboard-content"><div className="page-intro"><div><p className="eyebrow">Customer dashboard</p><h1 className="dashboard-title">Your <em>dashboard.</em></h1></div><p className="intro-copy">View bookings and digital QR tickets.</p></div>{bookings.length ? <div className="dashboard-layout"><div className="booking-list"><div className="section-heading compact"><h2>Upcoming tickets</h2><span className="muted-label">{bookings.length} booking{bookings.length === 1 ? '' : 's'}</span></div>{bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}</div><div className="dashboard-aside"><div className="aside-stat"><span>Bookings</span><strong>{bookings.length}</strong><p>Confirmed bookings</p></div><div className="aside-stat accent-stat"><span>Digital QR tickets</span><strong>{bookings.reduce((total, booking) => total + booking.tickets.length, 0)}</strong><p>Access your tickets.</p></div></div></div> : <div className="empty-state dashboard-empty-bookings"><div className="dashboard-empty-background" aria-hidden="true"><div className="responsive-hero-orbit" /><div className="responsive-hero-glow" /></div><div className="dashboard-empty-copy"><Ticket size={28} /><h2>No bookings found.</h2><p>Select tickets from an event detail page.</p><button className="button button-primary" onClick={onExplore}>Explore events <ArrowRight size={17} /></button></div></div>}</div>
  </section>;
}

function BookingCard({ booking }: { booking: Booking }) {
  return <article className="booking-card"><div className="booking-card-top"><div><span className="booking-status">{booking.status}</span><h2>{booking.event.title}</h2><p><CalendarDays size={14} />{formatLongDate(booking.event.date)} · {booking.event.time}</p><p><MapPin size={14} />{booking.event.venue}</p></div><div className="booking-ref">{booking.reference}<small>booking reference</small></div></div><TicketWallet booking={booking} /><div className="booking-card-footer"><span>Paid · ${booking.total.toFixed(2)}</span><span>Server-generated QR tickets</span></div></article>;
}

function OrganizerView({ events, loading, error, onRetry, onCreate, onPublish }: { events: EventSummary[]; loading: boolean; error: string; onRetry: () => void; onCreate: (event: EventDetails) => void; onPublish: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'pending_review'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const publishedCount = events.filter(event => event.status === 'published').length;
  const pendingCount = events.filter(event => event.status === 'pending_review').length;
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date))[0];
  const visibleEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const haystack = `${event.title} ${event.city} ${event.venue} ${event.category}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  });

  return <section className="section page-gutter organizer-dashboard">
    <div className="organizer-hero"><div><p className="eyebrow"><span className="eyebrow-dot" />Organizer dashboard</p><h1>Manage<br /><em>events.</em></h1><p className="intro-copy">Create, submit, and publish events to the marketplace.</p></div><div className="organizer-hero-actions"><button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create event</button><div className="organizer-hero-mark"><BarChart3 size={28} /><span>ORGANIZER<br />DASHBOARD</span></div></div></div>
    {createOpen && <CreateEventForm onCreated={event => { onCreate(event); setCreateOpen(false); }} onClose={() => setCreateOpen(false)} />}
    {loading ? <OrganizerLoading /> : error ? <div className="dashboard-message" role="alert"><CircleAlert size={22} /><div><h2>Could not load your event desk.</h2><p>{error}</p></div><button className="button button-secondary" onClick={onRetry}><RefreshCcw size={15} /> Try again</button></div> : <>
      <div className="organizer-kpis" aria-label="Organizer performance summary">
        <div className="kpi-card kpi-primary"><span>Published events</span><strong>{publishedCount}</strong><small><CheckCircle2 size={13} /> Visible in marketplace</small></div>
        <div className="kpi-card"><span>Events listed</span><strong>{events.length}</strong><small>Organizer events</small></div>
        <div className="kpi-card"><span>Pending events</span><strong>{pendingCount}</strong><small>{pendingCount ? 'Pending publish action' : 'No pending events'}</small></div>
        <div className="kpi-card kpi-date"><span>Upcoming event</span><strong>{upcoming ? formatShortDate(upcoming.date) : '—'}</strong><small>{upcoming ? upcoming.title : 'No upcoming events'}</small></div>
      </div>
      <div className="organizer-layout"><div className="desk-panel"><div className="panel-heading"><div><p className="eyebrow">Your listings</p><h2>Event desk</h2></div><span className="muted-label">{events.length} total</span></div><div className="desk-controls"><label className="desk-search"><Search size={15} /><span className="sr-only">Search your events</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search listings" /></label><div className="desk-filters" role="tablist" aria-label="Filter event listings"><Filter size={14} />{(['all', 'published', 'pending_review'] as const).map(item => <button key={item} className={filter === item ? 'is-active' : ''} role="tab" aria-selected={filter === item} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : item === 'published' ? 'Live' : 'Review'}</button>)}</div></div>{visibleEvents.length ? <div className="event-table" role="table" aria-label="Organizer event desk"><div className="event-table-head" role="row"><span role="columnheader">Event</span><span role="columnheader">Date</span><span role="columnheader">Reach</span><span role="columnheader">Status</span><span role="columnheader"><span className="sr-only">Actions</span></span></div>{visibleEvents.map(event => <div className="event-table-row" role="row" key={event.id}><div className="event-table-event" role="cell"><span className="event-table-image" style={{ backgroundImage: `url(${event.imageUrl})` }} /><span><strong title={event.title}>{event.title}</strong><small>{event.category} · {event.city}</small></span></div><span className="event-table-date" role="cell"><strong>{formatShortDate(event.date)}</strong><small>{event.time}</small></span><span className="event-table-reach" role="cell">{event.attendees.toLocaleString()} <small>attendees</small></span><span role="cell"><span className={`status-pill status-${event.status}`}>{event.status.replace('_', ' ')}</span></span><span className="event-table-action" role="cell">{event.status === 'published' ? <CheckCircle2 size={17} aria-label="Published" /> : <button className="button button-small" onClick={() => void onPublish(event.id)}>Publish <ArrowRight size={13} /></button>}</span></div>)}</div> : <div className="dashboard-empty"><Search size={22} /><h3>No listings match that view.</h3><p>Try another search or reset the status filter.</p><button className="text-link" onClick={() => { setQuery(''); setFilter('all'); }}>Reset filters <ArrowRight size={14} /></button></div>}</div><aside className="insight-rail"><div className="insight-card"><div className="panel-heading compact"><div><p className="eyebrow">At a glance</p><h2>Signal health</h2></div><span className="signal-dot" /></div><div className="health-meter"><span style={{ width: `${events.length ? Math.round((publishedCount / events.length) * 100) : 0}%` }} /></div><div className="health-label"><span>{publishedCount} live</span><strong>{events.length ? Math.round((publishedCount / events.length) * 100) : 0}%</strong></div><p>Keep your public listings current so attendees always know what is happening.</p></div><div className="insight-card run-of-show"><div className="panel-heading compact"><div><p className="eyebrow">Run of show</p><h2>Coming up</h2></div><CalendarDays size={18} /></div>{events.length ? <div className="upcoming-list">{[...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).map(event => <div className="upcoming-item" key={event.id}><span className="upcoming-date">{formatShortDate(event.date)}</span><span><strong>{event.title}</strong><small>{event.city} · {event.attendees.toLocaleString()} attending</small></span></div>)}</div> : <p className="insight-muted">Your next event will appear here.</p>}</div></aside></div>
    </>}
  </section>;
}

function OrganizerLoading() {
  return <div className="organizer-loading" aria-busy="true" aria-label="Loading organizer dashboard"><div className="loading-kpis">{[1, 2, 3, 4].map(item => <span key={item} />)}</div><div className="loading-board"><span /><span /><span /><span /></div></div>;
}

function AdminView({ summary, events, onPublish }: { summary: AdminSummary | null; events: EventSummary[]; onPublish: (id: string) => Promise<void> }) {
  return <section className="section page-gutter dashboard-page"><div className="page-intro"><div><p className="eyebrow">Admin dashboard</p><h1>Marketplace<br /><em>administration.</em></h1></div><p className="intro-copy">Monitor platform health, review new listings, and keep public inventory trustworthy.</p></div>{summary ? <><div className="admin-grid"><div className="admin-card admin-card-wide"><span>Gross volume</span><strong>${summary.grossVolume.toLocaleString()}</strong><p>Confirmed demo bookings</p></div><div className="admin-card"><span>Registered accounts</span><strong>{summary.users}</strong><p>Secure registration</p></div><div className="admin-card"><span>Published events</span><strong>{summary.publishedEvents}<small> / {summary.events}</small></strong><p>{summary.pendingEvents} pending review</p></div><div className="admin-card"><span>Bookings</span><strong>{summary.bookings}</strong><p>Completed checkouts</p></div><div className="admin-card"><span>Tickets redeemed</span><strong>{summary.ticketsRedeemed}</strong><p>Venue validation</p></div></div><AdminReview events={events} onPublish={onPublish} /></> : <div className="empty-state"><div className="loader-orbit small" /><p>Loading summary...</p></div>}</section>;
}

function Footer() {
  return <footer className="site-footer page-gutter"><div><span className="brand-text">eventra<span className="brand-dot">.</span></span><p>Event discovery and ticket reservation.</p></div><div className="footer-meta"><span>Digital QR tickets</span><span>© 2026 Eventra</span></div></footer>;
}

function initials(name: string): string {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(`${value}T12:00:00`));
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function toSummary(event: EventDetails): EventSummary {
  return { id: event.id, slug: event.slug, title: event.title, category: event.category, date: event.date, time: event.time, venue: event.venue, city: event.city, imageUrl: event.imageUrl, accent: event.accent, priceFrom: event.priceFrom, status: event.status, featured: event.featured, attendees: event.attendees };
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Try again.';
}
