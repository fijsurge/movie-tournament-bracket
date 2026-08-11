"use server";

import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { submitVoteSchema } from "@/lib/validation";
import { sumScores } from "@/lib/resolve-matchup";
import { maybeAutoAdvance } from "@/lib/phase-transitions";

export interface SubmitVoteState {
  error: string | null;
}

export async function submitVote(formInput: unknown): Promise<SubmitVoteState> {
  const parsed = submitVoteSchema.safeParse(formInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid vote" };
  }
  const { matchupId, scoresMovieA, scoresMovieB } = parsed.data;

  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
    include: { bracket: { include: { categories: true } } },
  });
  if (!matchup) {
    return { error: "Matchup not found" };
  }
  if (matchup.bracket.status !== "ACTIVE" || matchup.status !== "OPEN") {
    return { error: "This matchup isn't open for voting right now" };
  }
  if (!matchup.movieAId || !matchup.movieBId) {
    return { error: "This matchup isn't ready yet" };
  }

  const categoryKeys = matchup.bracket.categories.map((c) => c.key).sort();
  const providedAKeys = Object.keys(scoresMovieA).sort();
  const providedBKeys = Object.keys(scoresMovieB).sort();
  if (
    JSON.stringify(categoryKeys) !== JSON.stringify(providedAKeys) ||
    JSON.stringify(categoryKeys) !== JSON.stringify(providedBKeys)
  ) {
    return { error: "Please rate every category for both movies" };
  }

  const voterId = await getVoterId(matchup.bracketId);
  if (!voterId) {
    return { error: "You need to identify yourself first" };
  }

  const totalA = sumScores(scoresMovieA);
  const totalB = sumScores(scoresMovieB);

  await prisma.vote.upsert({
    where: { matchupId_voterId: { matchupId, voterId } },
    update: {
      scoresMovieA: JSON.stringify(scoresMovieA),
      scoresMovieB: JSON.stringify(scoresMovieB),
      totalA,
      totalB,
    },
    create: {
      matchupId,
      voterId,
      scoresMovieA: JSON.stringify(scoresMovieA),
      scoresMovieB: JSON.stringify(scoresMovieB),
      totalA,
      totalB,
    },
  });

  await maybeAutoAdvance(matchup.bracketId);
  return { error: null };
}
