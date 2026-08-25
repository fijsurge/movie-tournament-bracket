import "server-only";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { computeSeedOrder, computeSeedOrderFromTmdbRatings } from "@/lib/seeding";
import { generateBracket } from "@/lib/bracket-generator";
import { resolveMatchup } from "@/lib/resolve-matchup";
import { isNominationComplete, isSeedingComplete, isRoundComplete } from "@/lib/phase-completion";
import type { SeedInput } from "@/types/bracket";

// ---------------------------------------------------------------------------
// Core phase transitions — the actual mutation logic, callable both from the
// admin's manual buttons (app/admin/brackets/[slug]/actions.ts) and from the
// auto-advance checks below. Guard conditions mirror the original admin
// actions so calling these is always safe/idempotent even if a check race.
// ---------------------------------------------------------------------------

export async function closeNominationsCore(bracketId: string): Promise<void> {
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (bracket.status !== "NOMINATING") return;
  const movieCount = await prisma.movie.count({ where: { bracketId } });
  if (movieCount < 2) return;
  await prisma.bracket.update({ where: { id: bracketId }, data: { status: "SEEDING" } });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

// Shared tail for both closeSeedingCore and quickSeedCore — generates the
// bracket from a seed order (however it was derived) and persists it.
async function generateAndPersistBracket(bracketId: string, bracketSlug: string, seedOrder: SeedInput[]): Promise<void> {
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

  revalidatePath(`/admin/brackets/${bracketSlug}`);
}

export async function closeSeedingCore(bracketId: string): Promise<void> {
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { movies: { include: { seedVotes: true } } },
  });
  if (bracket.status !== "SEEDING" || bracket.movies.length < 2) return;

  const seedOrder = computeSeedOrder(
    bracket.movies.map((m) => ({ movieId: m.id, scores: m.seedVotes.map((v) => v.score) })),
  );
  await generateAndPersistBracket(bracketId, bracket.slug, seedOrder);
}

// Admin escape hatch — ranks movies by TMDb's own audience rating instead of
// waiting on voters to rate everything themselves. Discards/ignores any
// partial SeedVote rows already collected; that's an accepted tradeoff for a
// shortcut (undoLastPhase already unwinds either kind of seeding identically).
export async function quickSeedCore(bracketId: string): Promise<void> {
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { movies: true },
  });
  if (bracket.status !== "SEEDING" || bracket.movies.length < 2) return;

  const seedOrder = computeSeedOrderFromTmdbRatings(
    bracket.movies.map((m) => ({ movieId: m.id, voteAverage: m.voteAverage })),
  );
  await generateAndPersistBracket(bracketId, bracket.slug, seedOrder);
}

export async function closeRoundCore(bracketId: string): Promise<void> {
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
        if (m.tiebreakAttempt === 0) {
          // First tie on this matchup — auto-reopen for a fresh vote
          // instead of waiting on the admin, same effect as the admin's
          // manual "reopen for revote" action, just automatic. Swiping is
          // disabled for this round (forceCategoryVoting) since a second
          // swipe would almost certainly reproduce the exact same tie —
          // swipe scores are a fixed 5/2 split per category, so a
          // coin-flip-close first vote swiped again produces an identical
          // tally. Forcing deliberate category scoring gives an actual
          // chance of a different, more considered outcome.
          await tx.vote.deleteMany({ where: { matchupId: m.id } });
          await tx.matchup.update({
            where: { id: m.id },
            data: { status: "OPEN", forceCategoryVoting: true, tiebreakAttempt: 1 },
          });
        } else {
          // Tied again after a deliberate revote — a coin flip decides it,
          // automatically, same mechanics as the admin's manual
          // resolveTiebreakCoinFlip action (still available as an
          // override, but no longer the only way this gets resolved).
          const winnerMovieId = randomInt(2) === 0 ? m.movieAId! : m.movieBId!;
          await tx.matchup.update({
            where: { id: m.id },
            data: { status: "RESOLVED", winnerMovieId, resolutionMethod: "COIN_FLIP" },
          });
          if (m.nextMatchupId && m.nextMatchupSlot) {
            await tx.matchup.update({
              where: { id: m.nextMatchupId },
              data: m.nextMatchupSlot === "A" ? { movieAId: winnerMovieId } : { movieBId: winnerMovieId },
            });
          }
        }
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

    // A freshly auto-reopened matchup is back to OPEN, not RESOLVED — the
    // round can't close until it (and any matchup still awaiting manual
    // admin intervention) is actually settled.
    const stillBlocked = await tx.matchup.count({
      where: { roundId: currentRound.id, status: { in: ["OPEN", "NEEDS_MANUAL_TIEBREAK"] } },
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

// A round doesn't close the instant everyone's voted — it opens a review
// window first, giving anyone who wants to double back and edit a score a
// clear chance to before their (possibly stale) vote gets used. See the
// ACTIVE branch of maybeAutoAdvance below, and confirmRoundVote in
// app/b/[slug]/vote/actions.ts for the "everyone confirmed, skip the wait"
// shortcut.
export const ROUND_CLOSE_GRACE_MS = 60_000;

// ---------------------------------------------------------------------------
// Auto-advance — checks whether every *invited* voter (Voter.email set, i.e.
// added through the admin's email-invite flow) has finished the current
// phase, and if so, advances it. Brackets with no invited voters are
// untouched — they keep using the manual admin buttons exactly as before.
// ---------------------------------------------------------------------------

export async function maybeAutoAdvance(bracketId: string): Promise<void> {
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (!bracket.autoAdvance) return;

  if (bracket.status === "NOMINATING") {
    if (bracket.nominationMode === "DRAFT") {
      // DRAFT mode's own pick handler (app/b/[slug]/draft/actions.ts) already
      // advances straight to SEEDING once poolTargetSize is reached — draft
      // turns cycle indefinitely otherwise, so there's no "turn order
      // exhausted" signal to check for here.
      return;
    }

    if (!bracket.nominationCapPerVoter) return;
    const invitedVoters = await prisma.voter.findMany({ where: { bracketId, email: { not: null } } });
    const movies = await prisma.movie.findMany({ where: { bracketId }, select: { nominatedByVoterId: true } });
    const counts: Record<string, number> = {};
    for (const m of movies) {
      if (!m.nominatedByVoterId) continue;
      counts[m.nominatedByVoterId] = (counts[m.nominatedByVoterId] ?? 0) + 1;
    }
    if (isNominationComplete(invitedVoters.map((v) => v.id), counts, bracket.nominationCapPerVoter)) {
      await closeNominationsCore(bracketId);
    }
    return;
  }

  if (bracket.status === "SEEDING") {
    const invitedVoters = await prisma.voter.findMany({ where: { bracketId, email: { not: null } } });
    const movieCount = await prisma.movie.count({ where: { bracketId } });
    const seedVotes = await prisma.seedVote.findMany({
      where: { bracketId, voterId: { in: invitedVoters.map((v) => v.id) } },
      select: { voterId: true },
    });
    const counts: Record<string, number> = {};
    for (const sv of seedVotes) counts[sv.voterId] = (counts[sv.voterId] ?? 0) + 1;
    if (isSeedingComplete(invitedVoters.map((v) => v.id), counts, movieCount)) {
      await closeSeedingCore(bracketId);
    }
    return;
  }

  if (bracket.status === "ACTIVE" && bracket.currentRound) {
    const round = await prisma.round.findUniqueOrThrow({
      where: { bracketId_roundNumber: { bracketId, roundNumber: bracket.currentRound } },
    });

    const invitedVoters = await prisma.voter.findMany({ where: { bracketId, email: { not: null } } });
    const openMatchups = await prisma.matchup.findMany({
      where: { bracketId, round: { roundNumber: bracket.currentRound }, status: "OPEN" },
      select: { id: true },
    });
    const openMatchupIds = openMatchups.map((m) => m.id);
    const votes = await prisma.vote.findMany({
      where: { matchupId: { in: openMatchupIds }, voterId: { in: invitedVoters.map((v) => v.id) } },
      select: { matchupId: true, voterId: true },
    });
    const votedPairs = new Set(votes.map((v) => `${v.matchupId}:${v.voterId}`));
    if (!isRoundComplete(invitedVoters.map((v) => v.id), openMatchupIds, votedPairs)) return;

    if (round.closesAt) {
      if (round.closesAt <= new Date()) {
        await closeRoundCore(bracketId);
      }
      return;
    }

    await prisma.$transaction([
      prisma.roundConfirmation.deleteMany({ where: { roundId: round.id } }),
      prisma.round.update({
        where: { id: round.id },
        data: { closesAt: new Date(Date.now() + ROUND_CLOSE_GRACE_MS) },
      }),
    ]);
  }
}

// Called from confirmRoundVote once a voter confirms — closes the round
// right away if every invited voter has now confirmed, instead of waiting
// out the rest of the review window.
export async function maybeCloseIfAllConfirmed(bracketId: string, roundId: string): Promise<void> {
  const invitedVoters = await prisma.voter.findMany({ where: { bracketId, email: { not: null } } });
  if (invitedVoters.length === 0) return;
  const confirmations = await prisma.roundConfirmation.findMany({ where: { roundId }, select: { voterId: true } });
  const confirmedIds = new Set(confirmations.map((c) => c.voterId));
  if (invitedVoters.every((v) => confirmedIds.has(v.id))) {
    await closeRoundCore(bracketId);
  }
}

// ---------------------------------------------------------------------------
// Undo — reverts the single most recently completed phase transition. Always
// pauses auto-advance on the way out so a still-satisfied completion
// condition doesn't immediately re-fire the transition the admin just undid.
// ---------------------------------------------------------------------------

export async function undoLastPhase(bracketId: string): Promise<void> {
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });

  if (bracket.status === "NOMINATING") {
    await prisma.bracket.update({ where: { id: bracketId }, data: { status: "SETUP", autoAdvance: false } });
  } else if (bracket.status === "SEEDING") {
    await prisma.$transaction([
      prisma.seedVote.deleteMany({ where: { bracketId } }),
      prisma.bracket.update({ where: { id: bracketId }, data: { status: "NOMINATING", autoAdvance: false } }),
    ]);
  } else if (bracket.status === "ACTIVE" && bracket.currentRound === 1) {
    await prisma.$transaction([
      prisma.round.deleteMany({ where: { bracketId } }), // cascades to Matchup and Vote
      prisma.movie.updateMany({ where: { bracketId }, data: { seed: null } }),
      prisma.bracket.update({
        where: { id: bracketId },
        data: { status: "SEEDING", currentRound: null, autoAdvance: false },
      }),
    ]);
  } else if (
    bracket.status === "COMPLETE" ||
    (bracket.status === "ACTIVE" && bracket.currentRound !== null && bracket.currentRound > 1)
  ) {
    const closedRoundNumber = bracket.status === "COMPLETE" ? bracket.currentRound! : bracket.currentRound! - 1;
    const closedRound = await prisma.round.findUniqueOrThrow({
      where: { bracketId_roundNumber: { bracketId, roundNumber: closedRoundNumber } },
    });

    await prisma.$transaction(async (tx) => {
      // Un-propagate the winners this round sent forward, then reopen the
      // matchups that produced them. Byes are left alone — they were
      // resolved at bracket-generation time, not by closing this round.
      const revertedMatchups = await tx.matchup.findMany({
        where: { roundId: closedRound.id, isBye: false, status: "RESOLVED" },
        select: { id: true, nextMatchupId: true, nextMatchupSlot: true },
      });
      for (const m of revertedMatchups) {
        if (m.nextMatchupId && m.nextMatchupSlot) {
          await tx.matchup.update({
            where: { id: m.nextMatchupId },
            data: m.nextMatchupSlot === "A" ? { movieAId: null } : { movieBId: null },
          });
        }
      }
      await tx.matchup.updateMany({
        where: { roundId: closedRound.id, isBye: false, status: "RESOLVED" },
        data: { status: "OPEN", winnerMovieId: null, resolutionMethod: null },
      });
      await tx.round.update({ where: { id: closedRound.id }, data: { status: "VOTING_OPEN" } });

      const nextRound = await tx.round.findUnique({
        where: { bracketId_roundNumber: { bracketId, roundNumber: closedRoundNumber + 1 } },
      });
      if (nextRound) {
        await tx.matchup.updateMany({
          where: { roundId: nextRound.id, status: "OPEN" },
          data: { status: "PENDING" },
        });
        await tx.round.update({ where: { id: nextRound.id }, data: { status: "PENDING" } });
      }

      await tx.bracket.update({
        where: { id: bracketId },
        data: { status: "ACTIVE", currentRound: closedRoundNumber, autoAdvance: false },
      });
    });
  }

  revalidatePath(`/admin/brackets/${bracket.slug}`);
}
