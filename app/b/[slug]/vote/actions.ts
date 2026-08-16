"use server";

import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { submitVoteSchema } from "@/lib/validation";
import { sumScores } from "@/lib/resolve-matchup";
import { maybeAutoAdvance, maybeCloseIfAllConfirmed } from "@/lib/phase-transitions";

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

  // A round's review window (Round.closesAt) only ever opens once every
  // invited voter already has a vote on every open matchup — so reaching
  // this point with the window still active means this submit is
  // necessarily an edit to an already-counted vote, not a first-time one.
  // Cancel the window and every confirmation: the picks changed, so
  // whoever already confirmed should get a fresh look. maybeAutoAdvance
  // below immediately re-detects completeness (this voter's vote is still
  // on file, just changed) and re-arms a fresh window.
  const round = await prisma.round.findUnique({ where: { id: matchup.roundId } });
  if (round?.closesAt) {
    await prisma.$transaction([
      prisma.round.update({ where: { id: round.id }, data: { closesAt: null } }),
      prisma.roundConfirmation.deleteMany({ where: { roundId: round.id } }),
    ]);
  }

  await maybeAutoAdvance(matchup.bracketId);
  return { error: null };
}

export async function confirmRoundVote(bracketId: string): Promise<SubmitVoteState> {
  const voterId = await getVoterId(bracketId);
  if (!voterId) {
    return { error: "You need to identify yourself first" };
  }

  const bracket = await prisma.bracket.findUnique({ where: { id: bracketId } });
  if (!bracket || bracket.status !== "ACTIVE" || !bracket.currentRound) {
    return { error: "Voting isn't open right now" };
  }

  const round = await prisma.round.findUnique({
    where: { bracketId_roundNumber: { bracketId, roundNumber: bracket.currentRound } },
  });
  if (!round?.closesAt) {
    return { error: null }; // nothing active to confirm — a stale click after the round already moved on
  }

  await prisma.roundConfirmation.upsert({
    where: { roundId_voterId: { roundId: round.id, voterId } },
    update: {},
    create: { roundId: round.id, voterId },
  });

  await maybeCloseIfAllConfirmed(bracketId, round.id);
  return { error: null };
}
