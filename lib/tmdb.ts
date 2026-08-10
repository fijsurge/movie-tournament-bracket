import "server-only";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

export interface TmdbMovieResult {
  tmdbId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
}

interface TmdbSearchResponseResult {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
}

interface TmdbSearchResponse {
  results: TmdbSearchResponseResult[];
}

export async function searchMovies(query: string): Promise<TmdbMovieResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY environment variable is not set");
  }
  if (!query.trim()) {
    return [];
  }

  const url = new URL(`${TMDB_API_BASE}/search/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`TMDb search failed: ${res.status}`);
  }
  const data = (await res.json()) as TmdbSearchResponse;

  return data.results.slice(0, 8).map((r) => ({
    tmdbId: r.id,
    title: r.title,
    year: r.release_date ? r.release_date.slice(0, 4) : null,
    posterUrl: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : null,
  }));
}
