import { describe, expect, it } from "vitest";
import { roundPointValue, computeDraftScores } from "./scoring";

describe("roundPointValue", () => {
  it("doubles each round", () => {
    expect(roundPointValue(1)).toBe(1);
    expect(roundPointValue(2)).toBe(2);
    expect(roundPointValue(3)).toBe(4);
    expect(roundPointValue(4)).toBe(8);
  });
});

describe("computeDraftScores", () => {
  it("is empty with no resolved matchups", () => {
    expect(computeDraftScores([], [])).toEqual([]);
  });

  it("ignores unresolved matchups and movies with no drafting voter", () => {
    const movies = [{ id: "m1", seed: 1, nominatedByVoterId: null }];
    const resolved = [
      { roundNumber: 1, winnerMovieId: null },
      { roundNumber: 1, winnerMovieId: "m1" },
    ];
    expect(computeDraftScores(resolved, movies)).toEqual([]);
  });

  it("sums round_value x seed across every round a voter's movie wins", () => {
    const movies = [{ id: "m1", seed: 3, nominatedByVoterId: "a" }];
    const resolved = [
      { roundNumber: 1, winnerMovieId: "m1" }, // 1 * 3 = 3
      { roundNumber: 2, winnerMovieId: "m1" }, // 2 * 3 = 6
      { roundNumber: 3, winnerMovieId: "m1" }, // 4 * 3 = 12
    ];
    expect(computeDraftScores(resolved, movies)).toEqual([{ voterId: "a", points: 21 }]);
  });

  it("sorts multiple voters highest first and preserves an exact tie", () => {
    const movies = [
      { id: "m1", seed: 1, nominatedByVoterId: "a" },
      { id: "m2", seed: 1, nominatedByVoterId: "b" },
      { id: "m3", seed: 2, nominatedByVoterId: "c" },
    ];
    const resolved = [
      { roundNumber: 1, winnerMovieId: "m1" }, // a: 1
      { roundNumber: 1, winnerMovieId: "m2" }, // b: 1
      { roundNumber: 1, winnerMovieId: "m3" }, // c: 2
    ];
    expect(computeDraftScores(resolved, movies)).toEqual([
      { voterId: "c", points: 2 },
      { voterId: "a", points: 1 },
      { voterId: "b", points: 1 },
    ]);
  });
});
