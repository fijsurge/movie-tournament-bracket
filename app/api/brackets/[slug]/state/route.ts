import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TMDB_GENRES } from "@/lib/genres";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { order: "asc" } },
      movies: { include: { nominatedByVoter: true, seedVotes: true }, orderBy: { createdAt: "asc" } },
      draftState: true,
      voters: true,
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          matchups: {
            orderBy: { position: "asc" },
            include: { movieA: true, movieB: true, winnerMovie: true },
          },
        },
      },
    },
  });

  if (!bracket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const genreIds = bracket.filterGenreIds ? (JSON.parse(bracket.filterGenreIds) as number[]) : [];
  const filterParts = [
    bracket.filterPersonName,
    genreIds.length > 0
      ? genreIds.map((id) => TMDB_GENRES.find((g) => g.id === id)?.name).filter(Boolean).join("/")
      : null,
    bracket.filterYearMin || bracket.filterYearMax
      ? `${bracket.filterYearMin ?? "…"}-${bracket.filterYearMax ?? "…"}`
      : null,
  ].filter(Boolean);
  const hasFilters = filterParts.length > 0;
  const filterSummary = hasFilters ? filterParts.join(" · ") : null;

  let draft = null;
  if (bracket.draftState) {
    const turnOrder = JSON.parse(bracket.draftState.turnOrder) as string[];
    const votersById = new Map(bracket.voters.map((v) => [v.id, v.name]));
    draft = {
      turnOrder,
      currentTurnIndex: bracket.draftState.currentTurnIndex,
      currentVoterId: turnOrder[bracket.draftState.currentTurnIndex] ?? null,
      currentVoterName: turnOrder[bracket.draftState.currentTurnIndex]
        ? (votersById.get(turnOrder[bracket.draftState.currentTurnIndex]) ?? null)
        : null,
      participantNames: turnOrder.map((id) => votersById.get(id) ?? "Unknown"),
      isComplete: bracket.draftState.currentTurnIndex >= turnOrder.length,
    };
  }

  return NextResponse.json({
    bracket: {
      id: bracket.id,
      slug: bracket.slug,
      name: bracket.name,
      status: bracket.status,
      nominationMode: bracket.nominationMode,
      nominationCapPerVoter: bracket.nominationCapPerVoter,
      poolTargetSize: bracket.poolTargetSize,
      hasFilters,
      filterSummary,
    },
    categories: bracket.categories.map((c) => ({ key: c.key, label: c.label, isTiebreaker: c.isTiebreaker })),
    movies: bracket.movies.map((m) => ({
      id: m.id,
      tmdbId: m.tmdbId,
      title: m.title,
      posterUrl: m.posterUrl,
      nominatedByName: m.nominatedByVoter?.name ?? null,
      nominatedByAvatar: m.nominatedByVoter?.avatar ?? null,
      seed: m.seed,
      seedVoteCount: m.seedVotes.length,
      seedVoteAverage:
        m.seedVotes.length === 0
          ? null
          : m.seedVotes.reduce((sum, v) => sum + v.score, 0) / m.seedVotes.length,
    })),
    voterNames: bracket.voters.map((v) => v.name),
    draft,
    rounds: bracket.rounds.map((r) => ({
      roundNumber: r.roundNumber,
      status: r.status,
      matchups: r.matchups.map((m) => ({
        id: m.id,
        position: m.position,
        isBye: m.isBye,
        status: m.status,
        movieA: m.movieA
          ? { id: m.movieA.id, title: m.movieA.title, posterUrl: m.movieA.posterUrl, seed: m.movieA.seed }
          : null,
        movieB: m.movieB
          ? { id: m.movieB.id, title: m.movieB.title, posterUrl: m.movieB.posterUrl, seed: m.movieB.seed }
          : null,
        winnerMovieId: m.winnerMovieId,
        winnerTitle: m.winnerMovie?.title ?? null,
      })),
    })),
  });
}
