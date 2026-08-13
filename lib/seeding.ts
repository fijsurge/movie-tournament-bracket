import type { SeedInput } from "@/types/bracket";

export interface SeedableMovie {
  movieId: string;
  scores: number[]; // each voter's 1-5 overall rating for this movie
}

/**
 * Averages each movie's seed-vote scores and ranks them into seed order
 * (highest average = seed 1). Ties keep their input order (stable sort),
 * i.e. whichever movie was nominated/added first.
 */
export function computeSeedOrder(movies: SeedableMovie[]): SeedInput[] {
  const withAverages = movies.map((m, index) => ({
    movieId: m.movieId,
    index,
    average: m.scores.length === 0 ? 0 : m.scores.reduce((sum, s) => sum + s, 0) / m.scores.length,
  }));

  withAverages.sort((a, b) => (b.average !== a.average ? b.average - a.average : a.index - b.index));

  return withAverages.map((m, i) => ({ movieId: m.movieId, seed: i + 1 }));
}

export interface TmdbRatableMovie {
  movieId: string;
  voteAverage: number | null;
}

/**
 * Ranks movies by TMDb's own 0-10 audience rating, descending — an escape
 * hatch for skipping manual seed voting entirely. Chosen over TMDb's
 * `popularity` because rating is the correct semantic analog to what manual
 * seeding measures (average audience opinion), not current trending buzz.
 * Missing ratings count as 0, ties broken by input order — same conventions
 * as computeSeedOrder.
 */
export function computeSeedOrderFromTmdbRatings(movies: TmdbRatableMovie[]): SeedInput[] {
  const withRatings = movies.map((m, index) => ({
    movieId: m.movieId,
    index,
    rating: m.voteAverage ?? 0,
  }));

  withRatings.sort((a, b) => (b.rating !== a.rating ? b.rating - a.rating : a.index - b.index));

  return withRatings.map((m, i) => ({ movieId: m.movieId, seed: i + 1 }));
}
