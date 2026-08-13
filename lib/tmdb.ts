import "server-only";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w92";

export interface TmdbMovieResult {
  tmdbId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
}

export interface TmdbPersonResult {
  personId: number;
  name: string;
  profileUrl: string | null;
}

export interface MovieFilters {
  personId?: number | null;
  genreIds?: number[] | null;
  yearMin?: number | null;
  yearMax?: number | null;
}

interface TmdbRawMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
}

export interface TmdbMovieDetails {
  overview: string | null;
  voteAverage: number | null;
  popularity: number | null;
  releaseYear: number | null;
  runtime: number | null;
  trailerKey: string | null;
}

interface TmdbVideo {
  type: string;
  site: string;
  key: string;
  official: boolean;
}

interface TmdbMovieDetailsRaw {
  overview?: string | null;
  vote_average?: number | null;
  popularity?: number | null;
  release_date?: string;
  runtime?: number | null;
  videos?: { results: TmdbVideo[] };
}

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY environment variable is not set");
  }
  return apiKey;
}

function toResult(m: TmdbRawMovie): TmdbMovieResult {
  return {
    tmdbId: m.id,
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : null,
    posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
  };
}

function matchesFilters(m: TmdbRawMovie, filters: MovieFilters): boolean {
  if (filters.genreIds && filters.genreIds.length > 0) {
    const genres = m.genre_ids ?? [];
    if (!filters.genreIds.some((g) => genres.includes(g))) return false;
  }
  const year = m.release_date ? Number(m.release_date.slice(0, 4)) : null;
  if (filters.yearMin && (year === null || year < filters.yearMin)) return false;
  if (filters.yearMax && (year === null || year > filters.yearMax)) return false;
  return true;
}

async function tmdbGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`TMDb request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

interface TmdbPage {
  results: TmdbRawMovie[];
  total_pages: number;
}

// Fetches up to `maxPages` of a paginated TMDb endpoint (20 results/page) so a
// filtered browse list is close to complete rather than just the first page.
async function tmdbGetPages(path: string, params: Record<string, string>, maxPages: number): Promise<TmdbRawMovie[]> {
  const first = await tmdbGet<TmdbPage>(path, { ...params, page: "1" });
  const pagesToFetch = Math.min(first.total_pages, maxPages);
  if (pagesToFetch <= 1) return first.results;

  const rest = await Promise.all(
    Array.from({ length: pagesToFetch - 1 }, (_, i) =>
      tmdbGet<TmdbPage>(path, { ...params, page: String(i + 2) }),
    ),
  );
  return [first.results, ...rest.map((page) => page.results)].flat();
}

function pickTrailerKey(videos: TmdbVideo[] | undefined): string | null {
  if (!videos || videos.length === 0) return null;
  return (
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube" && v.official)?.key ??
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube")?.key ??
    videos.find((v) => v.site === "YouTube")?.key ??
    null
  );
}

// Single-call detail + trailer fetch via append_to_response=videos, used at
// nomination time so trailer playback never depends on a live TMDb call
// during a reveal moment. Never throws — a failed request or a movie with no
// trailer both resolve to null, so callers don't need their own try/catch.
export async function getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails | null> {
  try {
    const data = await tmdbGet<TmdbMovieDetailsRaw>(`/movie/${tmdbId}`, { append_to_response: "videos" });
    return {
      overview: data.overview ?? null,
      voteAverage: data.vote_average ?? null,
      popularity: data.popularity ?? null,
      releaseYear: data.release_date ? Number(data.release_date.slice(0, 4)) : null,
      runtime: data.runtime ?? null,
      trailerKey: pickTrailerKey(data.videos?.results),
    };
  } catch {
    return null;
  }
}

/**
 * Searches for movies, honoring a bracket's optional cast/genre/year filters.
 * - A person filter restricts candidates to that person's on-screen credits.
 * - Otherwise, a text query hits TMDb's title search; an empty query with no
 *   text falls back to Discover (sorted by popularity) so admins can still
 *   browse a genre/year-scoped list without knowing exact titles.
 * - Genre and year filters are applied as a local pass afterward, since
 *   neither the search nor person-credits endpoints support them directly.
 */
export async function searchFilteredMovies(query: string, filters: MovieFilters): Promise<TmdbMovieResult[]> {
  const trimmed = query.trim();
  let candidates: TmdbRawMovie[];

  if (filters.personId) {
    const data = await tmdbGet<{ cast: TmdbRawMovie[] }>(`/person/${filters.personId}/movie_credits`, {});
    candidates = data.cast;
    if (trimmed) {
      const q = trimmed.toLowerCase();
      candidates = candidates.filter((m) => m.title.toLowerCase().includes(q));
    }
  } else if (trimmed) {
    const data = await tmdbGet<{ results: TmdbRawMovie[] }>("/search/movie", {
      query: trimmed,
      include_adult: "false",
    });
    candidates = data.results;
  } else if ((filters.genreIds && filters.genreIds.length > 0) || filters.yearMin || filters.yearMax) {
    candidates = await tmdbGetPages(
      "/discover/movie",
      {
        sort_by: "popularity.desc",
        include_adult: "false",
        ...(filters.genreIds && filters.genreIds.length > 0
          ? { with_genres: filters.genreIds.join(",") }
          : {}),
        ...(filters.yearMin ? { "primary_release_date.gte": `${filters.yearMin}-01-01` } : {}),
        ...(filters.yearMax ? { "primary_release_date.lte": `${filters.yearMax}-12-31` } : {}),
      },
      5,
    );
  } else {
    return [];
  }

  return candidates
    .filter((m) => matchesFilters(m, filters))
    .slice(0, 100)
    .map(toResult);
}

export async function searchPeople(query: string): Promise<TmdbPersonResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbGet<{
    results: { id: number; name: string; profile_path?: string | null; known_for_department?: string }[];
  }>("/search/person", { query: trimmed });

  return data.results.slice(0, 8).map((p) => ({
    personId: p.id,
    name: p.name,
    profileUrl: p.profile_path ? `${TMDB_PROFILE_BASE}${p.profile_path}` : null,
  }));
}
