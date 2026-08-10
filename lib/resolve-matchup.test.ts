import { describe, expect, it } from "vitest";
import { resolveMatchup, sumScores, type VoteRecord } from "./resolve-matchup";

describe("sumScores", () => {
  it("adds up category scores", () => {
    expect(sumScores({ story: 4, acting: 5, entertainment: 3, cruiseFactor: 5 })).toBe(17);
  });
});

describe("resolveMatchup", () => {
  const tiebreak = "cruiseFactor";

  it("decides by total score when totals differ", () => {
    const votes: VoteRecord[] = [
      { totalA: 18, totalB: 15, scoresMovieA: { cruiseFactor: 5 }, scoresMovieB: { cruiseFactor: 4 } },
      { totalA: 16, totalB: 14, scoresMovieA: { cruiseFactor: 4 }, scoresMovieB: { cruiseFactor: 3 } },
    ];
    expect(resolveMatchup(votes, tiebreak)).toEqual({ winner: "A", resolutionMethod: "SCORE" });
  });

  it("falls back to the tiebreak category when totals tie", () => {
    const votes: VoteRecord[] = [
      { totalA: 15, totalB: 15, scoresMovieA: { cruiseFactor: 5 }, scoresMovieB: { cruiseFactor: 3 } },
    ];
    expect(resolveMatchup(votes, tiebreak)).toEqual({ winner: "A", resolutionMethod: "TIEBREAK_CATEGORY" });
  });

  it("returns TIE when both the total and the tiebreak category are equal", () => {
    const votes: VoteRecord[] = [
      { totalA: 15, totalB: 15, scoresMovieA: { cruiseFactor: 4 }, scoresMovieB: { cruiseFactor: 4 } },
    ];
    expect(resolveMatchup(votes, tiebreak)).toEqual({ winner: "TIE", resolutionMethod: null });
  });
});
