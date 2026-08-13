import { describe, expect, it } from "vitest";
import { swipeToScores } from "./swipe-vote";

describe("swipeToScores", () => {
  it("gives the swiped-toward movie the max score on every category", () => {
    const { scoresA, scoresB } = swipeToScores(["story", "acting", "cruiseFactor"], "A");
    expect(scoresA).toEqual({ story: 5, acting: 5, cruiseFactor: 5 });
    expect(scoresB).toEqual({ story: 2, acting: 2, cruiseFactor: 2 });
  });

  it("flips which side wins based on the swipe direction", () => {
    const { scoresA, scoresB } = swipeToScores(["story", "acting"], "B");
    expect(scoresA).toEqual({ story: 2, acting: 2 });
    expect(scoresB).toEqual({ story: 5, acting: 5 });
  });

  it("covers every provided category key for both movies", () => {
    const categoryKeys = ["story", "acting", "entertainment", "cruiseFactor"];
    const { scoresA, scoresB } = swipeToScores(categoryKeys, "A");
    expect(Object.keys(scoresA).sort()).toEqual([...categoryKeys].sort());
    expect(Object.keys(scoresB).sort()).toEqual([...categoryKeys].sort());
  });
});
