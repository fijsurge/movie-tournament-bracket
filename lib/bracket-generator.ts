import type { GeneratedBracket, GeneratedMatchup, SeedInput } from "@/types/bracket";

export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Classic recursive NCAA-style seed slot order, e.g. size 8 -> [1,8,4,5,2,7,3,6].
 * Keeps top seeds apart for as long as possible.
 */
export function seedSlotOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const len = order.length;
    const next: number[] = [];
    for (const s of order) {
      next.push(s, 2 * len + 1 - s);
    }
    order = next;
  }
  return order;
}

/**
 * Builds the full single-elimination bracket tree for a seeded list of movies.
 * `seeds` must be sorted by seed ascending (seed 1 first) with seed numbers 1..N.
 * Handles non-power-of-2 counts via byes, which are auto-resolved and their
 * winner propagated into the next round's slot immediately.
 */
export function generateBracket(seeds: SeedInput[]): GeneratedBracket {
  const n = seeds.length;
  if (n < 2) {
    throw new Error("A bracket needs at least 2 movies");
  }

  const bySeed = new Map<number, string>();
  for (const { movieId, seed } of seeds) {
    bySeed.set(seed, movieId);
  }

  const size = nextPowerOfTwo(n);
  const totalRounds = Math.log2(size);
  const order = seedSlotOrder(size);

  const matchups: GeneratedMatchup[] = [];
  const autoResolvedByes: GeneratedBracket["autoResolvedByes"] = [];

  // Round 1
  const round1Count = size / 2;
  const round1Movies: (string | null)[] = [];
  for (let i = 0; i < round1Count; i++) {
    const seedA = order[2 * i];
    const seedB = order[2 * i + 1];
    const movieAId = seedA <= n ? (bySeed.get(seedA) ?? null) : null;
    const movieBId = seedB <= n ? (bySeed.get(seedB) ?? null) : null;
    const isBye = movieAId === null || movieBId === null;

    matchups.push({
      roundNumber: 1,
      position: i,
      movieAId,
      movieBId,
      isBye,
      nextPosition: totalRounds > 1 ? Math.floor(i / 2) : null,
      nextSlot: totalRounds > 1 ? (i % 2 === 0 ? "A" : "B") : null,
    });

    const winnerMovieId = isBye ? (movieAId ?? movieBId) : null;
    round1Movies.push(winnerMovieId);
    if (isBye && winnerMovieId) {
      autoResolvedByes.push({ position: i, roundNumber: 1, winnerMovieId });
    }
  }

  // Round 2: fill in slots that round-1 byes already decided; everything else is TBD.
  // Rounds 3+: always TBD at generation time — they depend on real votes in round 2+,
  // never on generation-time propagation, so no further cascading is possible.
  for (let round = 2; round <= totalRounds; round++) {
    const count = size / Math.pow(2, round);
    for (let i = 0; i < count; i++) {
      const movieAId = round === 2 ? (round1Movies[2 * i] ?? null) : null;
      const movieBId = round === 2 ? (round1Movies[2 * i + 1] ?? null) : null;
      matchups.push({
        roundNumber: round,
        position: i,
        movieAId,
        movieBId,
        isBye: false,
        nextPosition: round < totalRounds ? Math.floor(i / 2) : null,
        nextSlot: round < totalRounds ? (i % 2 === 0 ? "A" : "B") : null,
      });
    }
  }

  return { totalRounds, matchups, autoResolvedByes };
}
