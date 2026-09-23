import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, Pause, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Movie } from '@eventra/shared';

type MovieReelProps = {
  movies: Movie[];
  onExplore: () => void;
};

const slotLayouts = [
  { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, blur: '0px' },
  { x: 112, y: 28, scale: 0.9, rotate: 7, opacity: 0.86, blur: '0px' },
  { x: 208, y: 74, scale: 0.78, rotate: 13, opacity: 0.5, blur: '1px' },
  { x: 286, y: 132, scale: 0.67, rotate: 19, opacity: 0.22, blur: '2px' },
  { x: 348, y: 190, scale: 0.58, rotate: 25, opacity: 0, blur: '4px' },
];

export default function MovieReel({ movies, onExplore }: MovieReelProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setActiveIndex(current => movies.length ? current % movies.length : 0);
  }, [movies.length]);

  useEffect(() => {
    if (reduceMotion || paused || movies.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveIndex(current => (current + 1) % movies.length), 5200);
    return () => window.clearInterval(timer);
  }, [movies.length, paused, reduceMotion]);

  if (!movies.length) {
    return <section className="movie-reel movie-reel-empty page-gutter" aria-live="polite"><div className="movie-reel-empty-copy"><Sparkles size={18} /><p>Loading the latest screen picks...</p></div></section>;
  }

  const activeMovie = movies[activeIndex] ?? movies[0];
  if (!activeMovie) return null;

  function move(delta: number) {
    setActiveIndex(current => (current + delta + movies.length) % movies.length);
  }

  return (
    <section className="movie-reel" aria-labelledby="movie-reel-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="movie-reel-noise" aria-hidden="true" />
      <div className="movie-reel-orbit movie-reel-orbit-one" aria-hidden="true" />
      <div className="movie-reel-orbit movie-reel-orbit-two" aria-hidden="true" />
      <div className="movie-reel-inner page-gutter">
        <div className="movie-reel-copy">
          <div className="movie-reel-kicker"><span className="eyebrow-dot" />Live screen picks <span className="movie-reel-source">{activeMovie.sourceLabel === 'TMDB' ? 'TMDB' : 'Demo catalog'}</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeMovie.id} initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }} transition={{ duration: reduceMotion ? 0 : 0.35 }}>
              <p className="eyebrow movie-reel-label">Selected works</p>
              <h1 id="movie-reel-title">Now showing<br /><em>{activeMovie.title}</em></h1>
              <p className="movie-reel-description">{activeMovie.description}</p>
              <div className="movie-reel-facts" aria-label={`${activeMovie.title} details`}>
                <span><strong>Release</strong>{formatMovieDate(activeMovie.releaseDate)}</span>
                <span><strong>From</strong>{formatPrice(activeMovie.ticketPriceFrom, activeMovie.currency)}</span>
                <span><strong>Format</strong>{activeMovie.industry} · {activeMovie.language}</span>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="movie-reel-actions">
            <button className="button button-primary" type="button" onClick={onExplore}>Explore events <ArrowUpRight size={16} /></button>
            <a className="movie-reel-source-link" href={activeMovie.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={13} /></a>
          </div>
          <div className="movie-reel-controls">
            <button type="button" className="movie-reel-control" onClick={() => move(-1)} aria-label="Previous movie"><ChevronLeft size={17} /></button>
            <button type="button" className="movie-reel-control" onClick={() => move(1)} aria-label="Next movie"><ChevronRight size={17} /></button>
            <button type="button" className="movie-reel-control movie-reel-play" onClick={() => setPaused(current => !current)} aria-label={paused ? 'Resume movie reel' : 'Pause movie reel'}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
            <span className="movie-reel-count">{String(activeIndex + 1).padStart(2, '0')} / {String(movies.length).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="movie-reel-stage" aria-label="Movie selection" role="region">
          {Array.from({ length: Math.min(5, movies.length) }, (_, slot) => {
            const movie = movies[(activeIndex + slot) % movies.length];
            if (!movie) return null;
            const layout = slotLayouts[slot] ?? slotLayouts[slotLayouts.length - 1]!;
            return <motion.button
              key={movie.id}
              className={`movie-reel-card movie-reel-card-${slot}`}
              type="button"
              aria-label={slot === 0 ? `Selected movie: ${movie.title}` : `Select ${movie.title}`}
              animate={{ x: layout.x, y: layout.y, scale: layout.scale, rotate: layout.rotate, opacity: layout.opacity, filter: `blur(${layout.blur})` }}
              transition={{ type: 'spring', stiffness: 125, damping: 20, mass: 0.8, duration: reduceMotion ? 0 : undefined }}
              drag={slot === 0 && !reduceMotion ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => { if (slot === 0 && Math.abs(info.offset.x) > 42) move(info.offset.x < 0 ? 1 : -1); }}
              onClick={() => slot !== 0 && setActiveIndex((activeIndex + slot) % movies.length)}
            >
              <img src={movie.imageUrl} alt="" />
              <span className="movie-reel-card-shade" />
              <span className="movie-reel-card-top"><span>{movie.industry}</span><span>{movie.rating}</span></span>
              <span className="movie-reel-card-bottom"><strong>{movie.title}</strong><small>{movie.genre} · {movie.runtime}</small></span>
            </motion.button>;
          })}
          <div className="movie-reel-stage-caption"><span>Frame {String(activeIndex + 1).padStart(2, '0')}</span><span>Swipe to browse</span></div>
        </div>
      </div>
    </section>
  );
}

function formatMovieDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}
