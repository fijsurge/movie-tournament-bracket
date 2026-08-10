import { describe, expect, it } from "vitest";
import { generateBracket, nextPowerOfTwo, seedSlotOrder } from "./bracket-generator";

describe("nextPowerOfTwo", () => {
  it("returns the same value for exact powers of two", () => {
    expect(nextPowerOfTwo(8)).toBe(8);
  });
  it("rounds up otherwise", () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
  });
});

describe("seedSlotOrder", () => {
  it("matches the classic NCAA seed order for size 8", () => {
    expect(seedSlotOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
  it("matches for size 4", () => {
    expect(seedSlotOrder(4)).toEqual([1, 4, 2, 3]);
  });
});

function seeds(n: number) {
  return Array.from({ length: n }, (_, i) => ({ movieId: `m${i + 1}`, seed: i + 1 }));
}

describe("generateBracket", () => {
  it("builds a full bracket for a power-of-2 count with no byes", () => {
    const result = generateBracket(seeds(4));
    expect(result.totalRounds).toBe(2);
    expect(result.autoResolvedByes).toHaveLength(0);
    const round1 = result.matchups.filter((m) => m.roundNumber === 1);
    expect(round1).toHaveLength(2);
    expect(round1.every((m) => !m.isBye)).toBe(true);
    const final = result.matchups.find((m) => m.roundNumber === 2);
    expect(final?.movieAId).toBeNull();
    expect(final?.movieBId).toBeNull();
  });

  it("handles a non-power-of-2 count with byes and propagates them one round forward", () => {
    // N=5, P=8: seed order [1,8,4,5,2,7,3,6] -> matches: 1v8(bye,seed1 wins), 4v5(real), 2v7(bye,seed2 wins), 3v6(bye,seed3 wins)
    const result = generateBracket(seeds(5));
    expect(result.totalRounds).toBe(3);
    expect(result.autoResolvedByes).toHaveLength(3);

    const round1 = result.matchups.filter((m) => m.roundNumber === 1);
    expect(round1).toHaveLength(4);
    expect(round1[0].isBye).toBe(true); // 1 v 8(missing)
    expect(round1[0].movieAId).toBe("m1");
    expect(round1[0].movieBId).toBeNull();
    expect(round1[1].isBye).toBe(false); // 4 v 5, both real

    const round2 = result.matchups.filter((m) => m.roundNumber === 2);
    expect(round2).toHaveLength(2);
    // position 0 fed by round1 positions 0 (bye->m1) and 1 (undecided) => m1 vs TBD
    expect(round2[0].movieAId).toBe("m1");
    expect(round2[0].movieBId).toBeNull();
    // position 1 fed by round1 positions 2 (bye->m2/seed2) and 3 (bye->m3/seed3) => both known immediately
    expect(round2[1].movieAId).toBe("m2");
    expect(round2[1].movieBId).toBe("m3");

    const round3 = result.matchups.filter((m) => m.roundNumber === 3);
    expect(round3).toHaveLength(1);
    expect(round3[0].movieAId).toBeNull();
    expect(round3[0].movieBId).toBeNull();
  });

  it("wires nextPosition/nextSlot so every non-final matchup feeds forward", () => {
    const result = generateBracket(seeds(4));
    const round1 = result.matchups.filter((m) => m.roundNumber === 1);
    expect(round1[0].nextPosition).toBe(0);
    expect(round1[0].nextSlot).toBe("A");
    expect(round1[1].nextPosition).toBe(0);
    expect(round1[1].nextSlot).toBe("B");
    const final = result.matchups.find((m) => m.roundNumber === 2)!;
    expect(final.nextPosition).toBeNull();
    expect(final.nextSlot).toBeNull();
  });

  it("throws for fewer than 2 movies", () => {
    expect(() => generateBracket(seeds(1))).toThrow();
  });
});
