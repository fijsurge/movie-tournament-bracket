import type { CategoryScores } from "@/types/bracket";

const SWIPE_WINNER_SCORE = 5;
const SWIPE_LOSER_SCORE = 2;

/**
 * Pre-fills every category for a Tinder-style swipe: max score for the
 * swiped-toward movie, a modest (non-zero) default for the other. This
 * satisfies submitVote's exact category-key-set validation immediately —
 * it's a fast accelerator, not a bypass — while every value stays editable
 * in the normal per-category scorer afterward.
 */
export function swipeToScores(
  categoryKeys: string[],
  winner: "A" | "B",
): { scoresA: CategoryScores; scoresB: CategoryScores } {
  const scoresA: CategoryScores = {};
  const scoresB: CategoryScores = {};
  for (const key of categoryKeys) {
    scoresA[key] = winner === "A" ? SWIPE_WINNER_SCORE : SWIPE_LOSER_SCORE;
    scoresB[key] = winner === "B" ? SWIPE_WINNER_SCORE : SWIPE_LOSER_SCORE;
  }
  return { scoresA, scoresB };
}
