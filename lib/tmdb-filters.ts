// Pure filter logic, split out from lib/tmdb.ts (which imports "server-only")
// so it stays directly unit-testable without a Next.js/webpack environment.

export interface TmdbRawMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
}

export interface MovieFilters {
  personIds?: number[] | null;
  companyIds?: number[] | null;
  keywordIds?: number[] | null;
  collectionIds?: number[] | null;
  genreIds?: number[] | null;
  yearMin?: number | null;
  yearMax?: number | null;
}

// Genre must match ALL selected genres (AND) — "romantic comedy" means Comedy
// *and* Romance, not either. Company/keyword membership isn't checked here:
// TMDb's list-shaped responses (search/credits) never carry that data, only
// Discover's server-side with_companies/with_keywords params do — see
// searchFilteredMovies in lib/tmdb.ts for where that's actually enforced.
export function matchesFilters(m: TmdbRawMovie, filters: MovieFilters): boolean {
  if (filters.genreIds && filters.genreIds.length > 0) {
    const genres = m.genre_ids ?? [];
    if (!filters.genreIds.every((g) => genres.includes(g))) return false;
  }
  const year = m.release_date ? Number(m.release_date.slice(0, 4)) : null;
  if (filters.yearMin && (year === null || year < filters.yearMin)) return false;
  if (filters.yearMax && (year === null || year > filters.yearMax)) return false;
  return true;
}

export function dedupeById(movies: TmdbRawMovie[]): TmdbRawMovie[] {
  const seen = new Set<number>();
  return movies.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}
