import type { Movie, MovieIndustry } from '@eventra/shared';
import { env } from './config.js';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w780';
const industries: Array<{ name: MovieIndustry; language: string; region?: string }> = [
  { name: 'Bollywood', language: 'hi', region: 'IN' },
  { name: 'Tollywood', language: 'te', region: 'IN' },
  { name: 'Hollywood', language: 'en', region: 'US' },
];

const fallbackMovies: Movie[] = [
  {
    id: 'movie-neon-mumbai',
    title: 'Neon Mumbai',
    industry: 'Bollywood',
    genre: 'Musical drama',
    releaseDate: '2026-10-16',
    description: 'A kinetic story of ambition, friendship, and one last night on the city dance floor.',
    ticketPriceFrom: 12,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85',
    sourceUrl: 'https://www.themoviedb.org/search/movie?query=Neon%20Mumbai',
    sourceLabel: 'Eventra sample catalog',
    runtime: '2h 18m',
    language: 'Hindi',
    rating: 'UA 13+',
  },
  {
    id: 'movie-river-of-stars',
    title: 'River of Stars',
    industry: 'Tollywood',
    genre: 'Action adventure',
    releaseDate: '2026-11-06',
    description: 'A cartographer and a runaway pilot race across the Deccan before a hidden river disappears forever.',
    ticketPriceFrom: 10,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=85',
    sourceUrl: 'https://www.themoviedb.org/search/movie?query=River%20of%20Stars',
    sourceLabel: 'Eventra sample catalog',
    runtime: '2h 26m',
    language: 'Telugu',
    rating: 'UA 13+',
  },
  {
    id: 'movie-afterlight',
    title: 'Afterlight',
    industry: 'Hollywood',
    genre: 'Sci-fi thriller',
    releaseDate: '2026-12-04',
    description: 'When the last city loses its night sky, an astronomer follows a signal back to Earth.',
    ticketPriceFrom: 16,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85',
    sourceUrl: 'https://www.themoviedb.org/search/movie?query=Afterlight',
    sourceLabel: 'Eventra sample catalog',
    runtime: '2h 04m',
    language: 'English',
    rating: 'PG-13',
  },
  {
    id: 'movie-the-last-raga',
    title: 'The Last Raga',
    industry: 'Bollywood',
    genre: 'Romance',
    releaseDate: '2027-01-22',
    description: 'Two musicians find a second chance in the unfinished composition their families abandoned.',
    ticketPriceFrom: 11,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=85',
    sourceUrl: 'https://www.themoviedb.org/search/movie?query=The%20Last%20Raga',
    sourceLabel: 'Eventra sample catalog',
    runtime: '2h 11m',
    language: 'Hindi',
    rating: 'U',
  },
  {
    id: 'movie-monsoon-protocol',
    title: 'Monsoon Protocol',
    industry: 'Tollywood',
    genre: 'Mystery',
    releaseDate: '2027-02-12',
    description: 'A radio host receives a weather forecast that predicts a crime before it happens.',
    ticketPriceFrom: 10,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85',
    sourceUrl: 'https://www.themoviedb.org/search/movie?query=Monsoon%20Protocol',
    sourceLabel: 'Eventra sample catalog',
    runtime: '2h 02m',
    language: 'Telugu',
    rating: 'UA 13+',
  },
  {
    id: 'movie-orbiters',
    title: 'Orbiters',
    industry: 'Hollywood',
    genre: 'Space opera',
    releaseDate: '2027-03-19',
    description: 'Three repair crews cross a silent solar system to restart the beacon that brings ships home.',
    ticketPriceFrom: 18,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1200&q=85',
    sourceUrl: 'https://www.themoviedb.org/search/movie?query=Orbiters',
    sourceLabel: 'Eventra sample catalog',
    runtime: '2h 32m',
    language: 'English',
    rating: 'PG-13',
  },
];

type TmdbMovie = {
  id?: unknown;
  title?: unknown;
  original_title?: unknown;
  overview?: unknown;
  release_date?: unknown;
  poster_path?: unknown;
  backdrop_path?: unknown;
  genre_ids?: unknown;
  vote_average?: unknown;
  adult?: unknown;
};

type TmdbResponse = { results?: unknown };

export async function searchMovies(query?: string): Promise<{ data: Movie[]; source: 'tmdb' | 'demo' }> {
  if (!env.TMDB_API_KEY) return { data: filterFallbackMovies(query), source: 'demo' };

  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.all(industries.map(industry => fetchIndustryMovies(industry, today)));
  const movies = results.flat().filter(movie => matchesQuery(movie, query));
  return movies.length ? { data: movies.slice(0, 12), source: 'tmdb' } : { data: filterFallbackMovies(query), source: 'demo' };
}

async function fetchIndustryMovies(industry: (typeof industries)[number], today: string): Promise<Movie[]> {
  const url = new URL(`${TMDB_API}/discover/movie`);
  url.searchParams.set('api_key', env.TMDB_API_KEY!);
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('page', '1');
  url.searchParams.set('with_original_language', industry.language);
  url.searchParams.set('primary_release_date.gte', today);
  url.searchParams.set('primary_release_date.lte', addDays(today, 365));
  if (industry.region) url.searchParams.set('region', industry.region);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB returned ${response.status}`);
    const payload = await response.json() as TmdbResponse;
    const items = Array.isArray(payload.results) ? payload.results.filter(isTmdbMovie) : [];
    return items.slice(0, 4).map((movie, index) => mapTmdbMovie(movie, industry, index)).filter((movie): movie is Movie => movie !== null);
  } catch (error) {
    console.warn(`TMDB ${industry.name} fallback:`, error instanceof Error ? error.message : error);
    return [];
  }
}

function mapTmdbMovie(movie: TmdbMovie, industry: (typeof industries)[number], index: number): Movie | null {
  const id = numberValue(movie.id);
  const title = stringValue(movie.title) || stringValue(movie.original_title);
  const releaseDate = stringValue(movie.release_date);
  if (!id || !title || !releaseDate) return null;

  const fallback = fallbackMovies.find(item => item.industry === industry.name && item.id.endsWith(String(index + 1))) ?? fallbackMovies.find(item => item.industry === industry.name) ?? fallbackMovies[0]!;
  const posterPath = stringValue(movie.poster_path) || stringValue(movie.backdrop_path);
  const genreIds = Array.isArray(movie.genre_ids) ? movie.genre_ids.filter((value): value is number => typeof value === 'number') : [];
  const rating = movie.adult === true ? '18+' : 'NR';

  return {
    ...fallback,
    id: `tmdb-${id}`,
    title,
    genre: genreIds.map(genreName).filter(Boolean).slice(0, 2).join(' / ') || 'Feature film',
    releaseDate,
    description: stringValue(movie.overview) || 'Release details supplied by TMDB.',
    ticketPriceFrom: ticketEstimate(industry.name),
    imageUrl: posterPath ? `${TMDB_IMAGE}${posterPath}` : fallback.imageUrl,
    sourceUrl: `https://www.themoviedb.org/movie/${id}`,
    sourceLabel: 'TMDB',
    language: languageName(industry.language),
    rating,
  };
}

function filterFallbackMovies(query?: string): Movie[] {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return fallbackMovies;
  return fallbackMovies.filter(movie => matchesQuery(movie, normalizedQuery));
}

function matchesQuery(movie: Movie, query?: string): boolean {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return `${movie.title} ${movie.industry} ${movie.genre} ${movie.language}`.toLowerCase().includes(normalizedQuery);
}

function isTmdbMovie(value: unknown): value is TmdbMovie {
  return value !== null && typeof value === 'object';
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function ticketEstimate(industry: MovieIndustry): number {
  return industry === 'Hollywood' ? 16 : industry === 'Bollywood' ? 12 : 10;
}

function languageName(language: string): string {
  return language === 'hi' ? 'Hindi' : language === 'te' ? 'Telugu' : 'English';
}

function genreName(id: number): string {
  const genres: Record<number, string> = { 12: 'Adventure', 14: 'Fantasy', 18: 'Drama', 28: 'Action', 35: 'Comedy', 53: 'Thriller', 80: 'Crime', 878: 'Sci-fi', 10749: 'Romance', 10751: 'Family', 10752: 'War', 9648: 'Mystery' };
  return genres[id] ?? '';
}
