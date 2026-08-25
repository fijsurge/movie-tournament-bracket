import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildFilterSummary } from "@/lib/bracket-filters";
import { effectiveVoterName, effectiveVoterAvatar } from "@/lib/voter-display";
import { maybeAutoAdvance } from "@/lib/phase-transitions";
import { computeDraftScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Every bracket page polls this route every 5s (PhaseWatcher/TVView), so
  // it's also the passive sweep that closes a round once its review window
  // (Round.closesAt) has expired — nothing else re-checks that on its own
  // if no one submits another vote after the window opens.
  const bracketRef = await prisma.bracket.findUnique({ where: { slug }, select: { id: true } });
  if (bracketRef) await maybeAutoAdvance(bracketRef.id);

  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { order: "asc" } },
      movies: {
        include: { nominatedByVoter: { include: { person: true } }, seedVotes: true },
        orderBy: { createdAt: "asc" },
      },
      draftState: true,
      voters: { include: { person: true } },
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          matchups: {
            orderBy: { position: "asc" },
            include: { movieA: true, movieB: true, winnerMovie: true },
          },
          confirmations: { select: { voterId: true } },
        },
      },
    },
  });

  if (!bracket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { hasFilters, filterSummary } = buildFilterSummary(bracket);

  let draft = null;
  if (bracket.draftState) {
    const turnOrder = JSON.parse(bracket.draftState.turnOrder) as string[];
    const votersById = new Map(bracket.voters.map((v) => [v.id, effectiveVoterName(v)]));
    const isComplete = bracket.draftState.currentTurnIndex >= turnOrder.length;
    draft = {
      turnOrder,
      currentTurnIndex: bracket.draftState.currentTurnIndex,
      currentVoterId: turnOrder[bracket.draftState.currentTurnIndex] ?? null,
      currentVoterName: turnOrder[bracket.draftState.currentTurnIndex]
        ? (votersById.get(turnOrder[bracket.draftState.currentTurnIndex]) ?? null)
        : null,
      nextVoterName:
        !isComplete && turnOrder.length > 0
          ? (votersById.get(turnOrder[(bracket.draftState.currentTurnIndex + 1) % turnOrder.length]) ?? null)
          : null,
      participantNames: turnOrder.map((id) => votersById.get(id) ?? "Unknown"),
      isComplete,
    };
  }

  // Draft-mode-only for now (see lib/scoring.ts) — a voter's "entry" is
  // implicitly the movies they drafted, so this needs no extra data beyond
  // what's already fetched above.
  let leaderboard: { voterId: string; voterName: string; voterAvatar: string | null; points: number }[] | null =
    null;
  if (bracket.scoringEnabled && bracket.nominationMode === "DRAFT") {
    const votersById = new Map(bracket.voters.map((v) => [v.id, v]));
    const resolvedMatchups = bracket.rounds.flatMap((r) =>
      r.matchups.map((m) => ({ roundNumber: r.roundNumber, winnerMovieId: m.winnerMovieId })),
    );
    const movieInputs = bracket.movies.map((m) => ({
      id: m.id,
      seed: m.seed,
      nominatedByVoterId: m.nominatedByVoterId,
    }));
    leaderboard = computeDraftScores(resolvedMatchups, movieInputs).map((s) => {
      const voter = votersById.get(s.voterId);
      return {
        voterId: s.voterId,
        voterName: voter ? effectiveVoterName(voter) : "Unknown",
        voterAvatar: voter ? effectiveVoterAvatar(voter) : null,
        points: s.points,
      };
    });
  }

  return NextResponse.json({
    bracket: {
      id: bracket.id,
      slug: bracket.slug,
      name: bracket.name,
      status: bracket.status,
      nominationMode: bracket.nominationMode,
      contentType: bracket.contentType,
      characterName: bracket.characterName,
      nominationCapPerVoter: bracket.nominationCapPerVoter,
      poolTargetSize: bracket.poolTargetSize,
      hasFilters,
      filterSummary,
      invitedVoterCount: bracket.voters.filter((v) => v.email !== null).length,
    },
    categories: bracket.categories.map((c) => ({ key: c.key, label: c.label, isTiebreaker: c.isTiebreaker })),
    movies: bracket.movies.map((m) => ({
      id: m.id,
      tmdbId: m.tmdbId,
      title: m.title,
      posterUrl: m.posterUrl,
      overview: m.overview,
      voteAverage: m.voteAverage,
      releaseYear: m.releaseYear,
      runtime: m.runtime,
      trailerKey: m.trailerKey,
      filmTitle: m.filmTitle,
      filmYear: m.filmYear,
      nominatedByName: m.nominatedByVoter ? effectiveVoterName(m.nominatedByVoter) : null,
      nominatedByAvatar: m.nominatedByVoter ? effectiveVoterAvatar(m.nominatedByVoter) : null,
      seed: m.seed,
      seedVoteCount: m.seedVotes.length,
      seedVoteAverage:
        m.seedVotes.length === 0
          ? null
          : m.seedVotes.reduce((sum, v) => sum + v.score, 0) / m.seedVotes.length,
    })),
    voterNames: bracket.voters.map((v) => effectiveVoterName(v)),
    draft,
    leaderboard,
    rounds: bracket.rounds.map((r) => ({
      roundNumber: r.roundNumber,
      status: r.status,
      closesAt: r.closesAt ? r.closesAt.toISOString() : null,
      confirmedVoterIds: r.confirmations.map((c) => c.voterId),
      matchups: r.matchups.map((m) => ({
        id: m.id,
        position: m.position,
        isBye: m.isBye,
        status: m.status,
        movieA: m.movieA
          ? {
              id: m.movieA.id,
              title: m.movieA.title,
              posterUrl: m.movieA.posterUrl,
              seed: m.movieA.seed,
              trailerKey: m.movieA.trailerKey,
            }
          : null,
        movieB: m.movieB
          ? {
              id: m.movieB.id,
              title: m.movieB.title,
              posterUrl: m.movieB.posterUrl,
              seed: m.movieB.seed,
              trailerKey: m.movieB.trailerKey,
            }
          : null,
        winnerMovieId: m.winnerMovieId,
        winnerTitle: m.winnerMovie?.title ?? null,
        resolutionMethod: m.resolutionMethod,
        forceCategoryVoting: m.forceCategoryVoting,
      })),
    })),
  });
}
