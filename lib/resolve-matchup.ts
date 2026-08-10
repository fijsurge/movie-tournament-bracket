import type { CategoryScores } from "@/types/bracket";

export interface VoteRecord {
  totalA: number;
  totalB: number;
  scoresMovieA: CategoryScores;
  scoresMovieB: CategoryScores;
}

export type ResolutionOutcome =
  | { winner: "A" | "B"; resolutionMethod: "SCORE" | "TIEBREAK_CATEGORY" }
  | { winner: "TIE"; resolutionMethod: null };

/**
 * Decides a matchup from its votes: sum of all category totals first,
 * falling back to the bracket's designated tiebreaker category if tied.
 * A true tie (both exhausted) is returned as-is for the caller to route
 * to manual admin resolution (coin flip or revote).
 */
export function resolveMatchup(votes: VoteRecord[], tiebreakCategoryKey: string): ResolutionOutcome {
  const totalA = votes.reduce((sum, v) => sum + v.totalA, 0);
  const totalB = votes.reduce((sum, v) => sum + v.totalB, 0);

  if (totalA !== totalB) {
    return { winner: totalA > totalB ? "A" : "B", resolutionMethod: "SCORE" };
  }

  const tiebreakA = votes.reduce((sum, v) => sum + (v.scoresMovieA[tiebreakCategoryKey] ?? 0), 0);
  const tiebreakB = votes.reduce((sum, v) => sum + (v.scoresMovieB[tiebreakCategoryKey] ?? 0), 0);

  if (tiebreakA !== tiebreakB) {
    return { winner: tiebreakA > tiebreakB ? "A" : "B", resolutionMethod: "TIEBREAK_CATEGORY" };
  }

  return { winner: "TIE", resolutionMethod: null };
}

/** Sums a voter's per-category scores for one movie into its stored total. */
export function sumScores(scores: CategoryScores): number {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}
