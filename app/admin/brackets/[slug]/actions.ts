"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { computeSeedOrder } from "@/lib/seeding";
import { generateBracket } from "@/lib/bracket-generator";
import { resolveMatchup } from "@/lib/resolve-matchup";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function openNominations(bracketId: string): Promise<void> {
  await requireAdmin();
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (bracket.status !== "SETUP") return;
  await prisma.bracket.update({ where: { id: bracketId }, data: { status: "NOMINATING" } });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function startDraft(bracketId: string): Promise<void> {
  await requireAdmin();
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { voters: true },
  });
  if (bracket.status !== "NOMINATING" || bracket.nominationMode !== "DRAFT") return;

  await prisma.draftState.upsert({
    where: { bracketId },
    update: { turnOrder: JSON.stringify(shuffle(bracket.voters.map((v) => v.id))), currentTurnIndex: 0 },
    create: { bracketId, turnOrder: JSON.stringify(shuffle(bracket.voters.map((v) => v.id))), currentTurnIndex: 0 },
  });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function skipDraftTurn(bracketId: string): Promise<void> {
  await requireAdmin();
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { draftState: true },
  });
  if (!bracket.draftState) return;
  const turnOrder = JSON.parse(bracket.draftState.turnOrder) as string[];
  await prisma.draftState.update({
    where: { bracketId },
    data: { currentTurnIndex: (bracket.draftState.currentTurnIndex + 1) % turnOrder.length },
  });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function closeNominations(bracketId: string): Promise<void> {
  await requireAdmin();
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (bracket.status !== "NOMINATING") return;
  const movieCount = await prisma.movie.count({ where: { bracketId } });
  if (movieCount < 2) return;
  await prisma.bracket.update({ where: { id: bracketId }, data: { status: "SEEDING" } });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function closeSeeding(bracketId: string): Promise<void> {
  await requireAdmin();
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { movies: { include: { seedVotes: true } } },
  });
  if (bracket.status !== "SEEDING" || bracket.movies.length < 2) return;

  const seedOrder = computeSeedOrder(
    bracket.movies.map((m) => ({ movieId: m.id, scores: m.seedVotes.map((v) => v.score) })),
  );
  const generated = generateBracket(seedOrder);

  await prisma.$transaction(async (tx) => {
    await Promise.all(seedOrder.map((s) => tx.movie.update({ where: { id: s.movieId }, data: { seed: s.seed } })));

    const roundIdByNumber = new Map<number, string>();
    for (let roundNumber = 1; roundNumber <= generated.totalRounds; roundNumber++) {
      const round = await tx.round.create({
        data: {
          bracketId,
          roundNumber,
          status: roundNumber === 1 ? "VOTING_OPEN" : "PENDING",
        },
      });
      roundIdByNumber.set(roundNumber, round.id);
    }

    const matchupIdByRoundPosition = new Map<string, string>();
    for (const m of generated.matchups) {
      const winnerMovieId = m.isBye ? (m.movieAId ?? m.movieBId) : null;
      const matchup = await tx.matchup.create({
        data: {
          bracketId,
          roundId: roundIdByNumber.get(m.roundNumber)!,
          position: m.position,
          movieAId: m.movieAId,
          movieBId: m.movieBId,
          isBye: m.isBye,
          status: m.isBye ? "RESOLVED" : m.roundNumber === 1 ? "OPEN" : "PENDING",
          winnerMovieId,
        },
      });
      matchupIdByRoundPosition.set(`${m.roundNumber}:${m.position}`, matchup.id);
    }

    for (const m of generated.matchups) {
      if (m.nextPosition === null || m.nextSlot === null) continue;
      const matchupId = matchupIdByRoundPosition.get(`${m.roundNumber}:${m.position}`)!;
      const nextMatchupId = matchupIdByRoundPosition.get(`${m.roundNumber + 1}:${m.nextPosition}`)!;
      await tx.matchup.update({
        where: { id: matchupId },
        data: { nextMatchupId, nextMatchupSlot: m.nextSlot },
      });
    }

    await tx.bracket.update({ where: { id: bracketId }, data: { status: "ACTIVE", currentRound: 1 } });
  });

  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function closeRound(bracketId: string): Promise<void> {
  await requireAdmin();
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { categories: true, rounds: { orderBy: { roundNumber: "asc" } } },
  });
  if (bracket.status !== "ACTIVE" || !bracket.currentRound) return;

  const tiebreakCategory = bracket.categories.find((c) => c.isTiebreaker);
  if (!tiebreakCategory) return;

  const currentRound = bracket.rounds.find((r) => r.roundNumber === bracket.currentRound);
  if (!currentRound) return;

  const matchups = await prisma.matchup.findMany({
    where: { roundId: currentRound.id },
    include: { votes: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const m of matchups) {
      if (m.status !== "OPEN") continue;

      const votes = m.votes.map((v) => ({
        totalA: v.totalA,
        totalB: v.totalB,
        scoresMovieA: JSON.parse(v.scoresMovieA) as Record<string, number>,
        scoresMovieB: JSON.parse(v.scoresMovieB) as Record<string, number>,
      }));
      const outcome = resolveMatchup(votes, tiebreakCategory.key);

      if (outcome.winner === "TIE") {
        await tx.matchup.update({ where: { id: m.id }, data: { status: "NEEDS_MANUAL_TIEBREAK" } });
        continue;
      }

      const winnerMovieId = outcome.winner === "A" ? m.movieAId! : m.movieBId!;
      await tx.matchup.update({
        where: { id: m.id },
        data: { status: "RESOLVED", winnerMovieId, resolutionMethod: outcome.resolutionMethod },
      });
      if (m.nextMatchupId && m.nextMatchupSlot) {
        await tx.matchup.update({
          where: { id: m.nextMatchupId },
          data: m.nextMatchupSlot === "A" ? { movieAId: winnerMovieId } : { movieBId: winnerMovieId },
        });
      }
    }

    const stillBlocked = await tx.matchup.count({
      where: { roundId: currentRound.id, status: "NEEDS_MANUAL_TIEBREAK" },
    });
    if (stillBlocked > 0) return;

    await tx.round.update({ where: { id: currentRound.id }, data: { status: "COMPLETE" } });

    const totalRounds = bracket.rounds.length;
    if (bracket.currentRound! < totalRounds) {
      const nextRoundNumber = bracket.currentRound! + 1;
      const nextRound = bracket.rounds.find((r) => r.roundNumber === nextRoundNumber)!;
      await tx.matchup.updateMany({
        where: { roundId: nextRound.id, movieAId: { not: null }, movieBId: { not: null }, status: "PENDING" },
        data: { status: "OPEN" },
      });
      await tx.round.update({ where: { id: nextRound.id }, data: { status: "VOTING_OPEN" } });
      await tx.bracket.update({ where: { id: bracketId }, data: { currentRound: nextRoundNumber } });
    } else {
      await tx.bracket.update({ where: { id: bracketId }, data: { status: "COMPLETE" } });
    }
  });

  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function resolveTiebreakCoinFlip(matchupId: string): Promise<void> {
  await requireAdmin();
  const matchup = await prisma.matchup.findUniqueOrThrow({
    where: { id: matchupId },
    include: { bracket: true },
  });
  if (matchup.status !== "NEEDS_MANUAL_TIEBREAK" || !matchup.movieAId || !matchup.movieBId) return;

  const winnerMovieId = randomInt(2) === 0 ? matchup.movieAId : matchup.movieBId;

  await prisma.$transaction(async (tx) => {
    await tx.matchup.update({
      where: { id: matchupId },
      data: { status: "RESOLVED", winnerMovieId, resolutionMethod: "COIN_FLIP" },
    });
    if (matchup.nextMatchupId && matchup.nextMatchupSlot) {
      await tx.matchup.update({
        where: { id: matchup.nextMatchupId },
        data: matchup.nextMatchupSlot === "A" ? { movieAId: winnerMovieId } : { movieBId: winnerMovieId },
      });
    }
  });
  revalidatePath(`/admin/brackets/${matchup.bracket.slug}`);
}

export async function reopenForRevote(matchupId: string): Promise<void> {
  await requireAdmin();
  const matchup = await prisma.matchup.findUniqueOrThrow({
    where: { id: matchupId },
    include: { bracket: true },
  });
  if (matchup.status !== "NEEDS_MANUAL_TIEBREAK") return;

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany({ where: { matchupId } });
    await tx.matchup.update({ where: { id: matchupId }, data: { status: "OPEN" } });
  });
  revalidatePath(`/admin/brackets/${matchup.bracket.slug}`);
}
