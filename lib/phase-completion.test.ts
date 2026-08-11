import { describe, expect, it } from "vitest";
import { isNominationComplete, isSeedingComplete, isRoundComplete } from "./phase-completion";

describe("isNominationComplete", () => {
  it("is false with no invited voters, even if counts look complete", () => {
    expect(isNominationComplete([], {}, 2)).toBe(false);
  });

  it("is false until every invited voter has hit their cap", () => {
    expect(isNominationComplete(["a", "b"], { a: 2 }, 2)).toBe(false);
  });

  it("is true once every invited voter has met or exceeded their cap", () => {
    expect(isNominationComplete(["a", "b"], { a: 2, b: 3 }, 2)).toBe(true);
  });
});

describe("isSeedingComplete", () => {
  it("is false with fewer than 2 movies in the pool", () => {
    expect(isSeedingComplete(["a"], { a: 1 }, 1)).toBe(false);
  });

  it("is false until every invited voter has rated every movie", () => {
    expect(isSeedingComplete(["a", "b"], { a: 3, b: 2 }, 3)).toBe(false);
  });

  it("is true once every invited voter has rated at least every movie", () => {
    expect(isSeedingComplete(["a", "b"], { a: 3, b: 3 }, 3)).toBe(true);
  });
});

describe("isRoundComplete", () => {
  it("is false with no open matchups", () => {
    expect(isRoundComplete(["a"], [], new Set())).toBe(false);
  });

  it("is false until every invited voter has voted on every open matchup", () => {
    const votedPairs = new Set(["m1:a", "m2:a", "m1:b"]);
    expect(isRoundComplete(["a", "b"], ["m1", "m2"], votedPairs)).toBe(false);
  });

  it("is true once every invited voter has voted on every open matchup", () => {
    const votedPairs = new Set(["m1:a", "m2:a", "m1:b", "m2:b"]);
    expect(isRoundComplete(["a", "b"], ["m1", "m2"], votedPairs)).toBe(true);
  });
});
