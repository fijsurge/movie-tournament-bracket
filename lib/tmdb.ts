import "server-only";
import { matchesFilters, dedupeById, type TmdbRawMovie, type MovieFilters } from "./tmdb-filters";

export type { MovieFilters };

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w92"; // small — filter chips, search result rows
const TMDB_PROFILE_LARGE_BASE = "https://image.tmdb.org/t/p/w185"; // primary card image — character-bracket nominees

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

export interface TmdbCompanyResult {
  companyId: number;
  name: string;
  logoUrl: string | null;
}

export interface TmdbKeywordResult {
  keywordId: number;
  name: string;
}

export interface TmdbCollectionResult {
  collectionId: number;
  name: string;
  posterUrl: string | null;
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

// A collection's parts list is the exact, complete franchise roster (no
// Discover filtering needed or even possible — /discover/movie has no
// with_collections param) — used as-is, then optionally narrowed further by
// a typed title/genre/year filter same as any other candidate list.
async function getCollectionParts(collectionId: number): Promise<TmdbRawMovie[]> {
  const data = await tmdbGet<{ parts: TmdbRawMovie[] }>(`/collection/${collectionId}`, {});
  return data.parts;
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

// Detail fetch by id, mirroring getMovieDetails — used to hydrate a
// character-bracket nomination's actor name/photo at submit time, since
// searchPeople only returns what /search/person exposes (small w92 photo).
export async function getPersonDetails(
  personId: number,
): Promise<{ name: string; profileUrl: string | null } | null> {
  try {
    const data = await tmdbGet<{ name: string; profile_path?: string | null }>(`/person/${personId}`, {});
    return {
      name: data.name,
      profileUrl: data.profile_path ? `${TMDB_PROFILE_LARGE_BASE}${data.profile_path}` : null,
    };
  } catch {
    return null;
  }
}

/**
 * Searches for movies, honoring a bracket's optional scope filters. Branches
 * are tried in order of precision — most-specific wins, since combining an
 * exact-list filter (collection) with a fuzzy one (person/company) has no
 * obviously-correct semantic:
 *   1. Collections — exact by construction (see getCollectionParts).
 *   2. People — unions each person's on-screen credits (OR: "either of
 *      these actors/directors"), then narrowed by a typed query if present.
 *   3. A typed text query with no collection/person filter — hits TMDb's
 *      title search. Company/keyword filters aren't enforced past this
 *      point: TMDb's search results don't carry that data, only Discover's
 *      server-side params do, so a typed title is trusted to already be
 *      on-scope (same trust model genre used to implicitly rely on here).
 *   4. An empty query, with or without company/keyword/genre/year filters —
 *      Discover (sorted by popularity), so there's always something to
 *      browse instead of an empty screen, scoped by whatever filters happen
 *      to be set (none, for an unscoped bracket). Genre IDs are comma-joined
 *      (AND — "romantic comedy" needs Comedy *and* Romance); company/keyword
 *      IDs are pipe-joined (OR — matching either of the selected
 *      studios/tags is the more useful default). This is a different axis
 *      than genre's AND — don't conflate the two when editing.
 * Genre and year are always re-verified locally afterward (matchesFilters)
 * since every branch's candidates carry that data; company/keyword are not
 * (see matchesFilters).
 */
export async function searchFilteredMovies(query: string, filters: MovieFilters): Promise<TmdbMovieResult[]> {
  const trimmed = query.trim();
  let candidates: TmdbRawMovie[];

  if (filters.collectionIds && filters.collectionIds.length > 0) {
    const parts = await Promise.all(filters.collectionIds.map((id) => getCollectionParts(id)));
    candidates = dedupeById(parts.flat());
    if (trimmed) {
      const q = trimmed.toLowerCase();
      candidates = candidates.filter((m) => m.title.toLowerCase().includes(q));
    }
  } else if (filters.personIds && filters.personIds.length > 0) {
    const credits = await Promise.all(
      filters.personIds.map((id) => tmdbGet<{ cast: TmdbRawMovie[] }>(`/person/${id}/movie_credits`, {})),
    );
    candidates = dedupeById(credits.flatMap((c) => c.cast));
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
  } else {
    candidates = await tmdbGetPages(
      "/discover/movie",
      {
        sort_by: "popularity.desc",
        include_adult: "false",
        ...(filters.genreIds && filters.genreIds.length > 0 ? { with_genres: filters.genreIds.join(",") } : {}),
        ...(filters.companyIds && filters.companyIds.length > 0
          ? { with_companies: filters.companyIds.join("|") }
          : {}),
        ...(filters.keywordIds && filters.keywordIds.length > 0
          ? { with_keywords: filters.keywordIds.join("|") }
          : {}),
        ...(filters.yearMin ? { "primary_release_date.gte": `${filters.yearMin}-01-01` } : {}),
        ...(filters.yearMax ? { "primary_release_date.lte": `${filters.yearMax}-12-31` } : {}),
      },
      5,
    );
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

export async function searchCompanies(query: string): Promise<TmdbCompanyResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbGet<{ results: { id: number; name: string; logo_path?: string | null }[] }>(
    "/search/company",
    { query: trimmed },
  );

  return data.results.slice(0, 8).map((c) => ({
    companyId: c.id,
    name: c.name,
    logoUrl: c.logo_path ? `${TMDB_PROFILE_BASE}${c.logo_path}` : null,
  }));
}

// TMDb keyword tagging is community-sourced and incomplete — a search here
// can miss legitimate adaptations/themes, or need the exact tag phrasing.
export async function searchKeywords(query: string): Promise<TmdbKeywordResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbGet<{ results: { id: number; name: string }[] }>("/search/keyword", { query: trimmed });

  return data.results.slice(0, 8).map((k) => ({ keywordId: k.id, name: k.name }));
}

export async function searchCollections(query: string): Promise<TmdbCollectionResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbGet<{ results: { id: number; name: string; poster_path?: string | null }[] }>(
    "/search/collection",
    { query: trimmed },
  );

  return data.results.slice(0, 8).map((c) => ({
    collectionId: c.id,
    name: c.name,
    posterUrl: c.poster_path ? `${TMDB_IMAGE_BASE}${c.poster_path}` : null,
  }));
}
