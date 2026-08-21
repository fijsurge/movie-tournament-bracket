// Pure scoring math for the NCAA-pool-style points competition — no I/O, so
// easy to unit test and safe to import from anywhere (same shape as
// lib/phase-completion.ts). Draft-mode only for now: a voter's "bracket
// entry" is implicitly the movies they drafted (Movie.nominatedByVoterId),
// so there's no separate prediction step to track — just sum up what
// already happened.

// Round 1 = 1x seed, Round 2 = 2x seed, Round 3 = 4x seed, ... — classic
// doubling ESPN-bracket-pool scoring.
export function roundPointValue(roundNumber: number): number {
  return 2 ** (roundNumber - 1);
}

export interface VoterScore {
  voterId: string;
  points: number;
}

// Ties are real and expected — this just returns everyone's actual total,
// sorted highest first; callers decide how to present a tie for first
// (e.g. naming every co-leader rather than picking one arbitrarily).
export function computeDraftScores(
  resolvedMatchups: { roundNumber: number; winnerMovieId: string | null }[],
  movies: { id: string; seed: number | null; nominatedByVoterId: string | null }[],
): VoterScore[] {
  const movieById = new Map(movies.map((m) => [m.id, m]));
  const totals = new Map<string, number>();

  for (const matchup of resolvedMatchups) {
    if (!matchup.winnerMovieId) continue;
    const movie = movieById.get(matchup.winnerMovieId);
    if (!movie?.nominatedByVoterId || movie.seed === null) continue;
    const points = roundPointValue(matchup.roundNumber) * movie.seed;
    totals.set(movie.nominatedByVoterId, (totals.get(movie.nominatedByVoterId) ?? 0) + points);
  }

  return [...totals.entries()]
    .map(([voterId, points]) => ({ voterId, points }))
    .sort((a, b) => b.points - a.points);
}
