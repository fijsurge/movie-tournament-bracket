import { describe, expect, it } from "vitest";
import { computeSeedOrder } from "./seeding";

describe("computeSeedOrder", () => {
  it("ranks movies by average score, highest first", () => {
    const result = computeSeedOrder([
      { movieId: "a", scores: [3, 3] },
      { movieId: "b", scores: [5, 5] },
      { movieId: "c", scores: [4, 4] },
    ]);
    expect(result).toEqual([
      { movieId: "b", seed: 1 },
      { movieId: "c", seed: 2 },
      { movieId: "a", seed: 3 },
    ]);
  });

  it("breaks ties by input order", () => {
    const result = computeSeedOrder([
      { movieId: "a", scores: [4] },
      { movieId: "b", scores: [4] },
    ]);
    expect(result).toEqual([
      { movieId: "a", seed: 1 },
      { movieId: "b", seed: 2 },
    ]);
  });

  it("treats unrated movies as score 0", () => {
    const result = computeSeedOrder([
      { movieId: "a", scores: [] },
      { movieId: "b", scores: [1] },
    ]);
    expect(result).toEqual([
      { movieId: "b", seed: 1 },
      { movieId: "a", seed: 2 },
    ]);
  });
});
