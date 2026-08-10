import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { TMDB_GENRES } from "@/lib/genres";
import {
  openNominations,
  startDraft,
  skipDraftTurn,
  closeNominations,
  closeSeeding,
  closeRound,
  resolveTiebreakCoinFlip,
  reopenForRevote,
} from "./actions";

export default async function AdminBracketDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { order: "asc" } },
      movies: { include: { nominatedByVoter: true, seedVotes: true }, orderBy: { createdAt: "asc" } },
      voters: true,
      draftState: true,
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: { matchups: { orderBy: { position: "asc" }, include: { movieA: true, movieB: true, winnerMovie: true } } },
      },
    },
  });

  if (!bracket) {
    notFound();
  }

  const openNominationsForBracket = openNominations.bind(null, bracket.id);
  const startDraftForBracket = startDraft.bind(null, bracket.id);
  const skipDraftTurnForBracket = skipDraftTurn.bind(null, bracket.id);
  const closeNominationsForBracket = closeNominations.bind(null, bracket.id);
  const closeSeedingForBracket = closeSeeding.bind(null, bracket.id);
  const closeRoundForBracket = closeRound.bind(null, bracket.id);

  const currentRoundData = bracket.rounds.find((r) => r.roundNumber === bracket.currentRound);

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

  const turnOrder = bracket.draftState ? (JSON.parse(bracket.draftState.turnOrder) as string[]) : [];
  const votersById = new Map(bracket.voters.map((v) => [v.id, v.name]));
  const currentTurnVoterName = bracket.draftState
    ? (votersById.get(turnOrder[bracket.draftState.currentTurnIndex % turnOrder.length]) ?? "Unknown")
    : null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <AdminNav />
      <h1 className="text-2xl font-semibold">{bracket.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Status: <span className="font-medium">{bracket.status}</span> · Nomination mode:{" "}
        <span className="font-medium">{bracket.nominationMode}</span>
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Categories</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {bracket.categories.map((c) => (
            <li key={c.id} className="text-sm">
              {c.label} {c.isTiebreaker && <span className="text-neutral-500">(tiebreaker)</span>}
            </li>
          ))}
        </ul>
      </section>

      {filterParts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium">Search filter</h2>
          <p className="mt-1 text-sm text-neutral-500">{filterParts.join(" · ")}</p>
        </section>
      )}

      <section className="mt-6 rounded border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Bracket controls</h2>

        {bracket.status === "SETUP" && (
          <form action={openNominationsForBracket} className="mt-3">
            <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900">
              Open nominations
            </button>
          </form>
        )}

        {bracket.status === "NOMINATING" && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm">
              {bracket.movies.length} movie(s) nominated · {bracket.voters.length} voter(s) joined
            </p>

            {bracket.nominationMode === "DRAFT" && !bracket.draftState && (
              <div>
                <p className="mb-2 text-sm text-neutral-500">
                  Joined: {bracket.voters.map((v) => v.name).join(", ") || "no one yet"}
                </p>
                <form action={startDraftForBracket}>
                  <button
                    type="submit"
                    disabled={bracket.voters.length < 1}
                    className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                  >
                    Start draft
                  </button>
                </form>
              </div>
            )}

            {bracket.nominationMode === "DRAFT" && bracket.draftState && (
              <div className="flex items-center gap-3">
                <p className="text-sm">
                  Current turn: <span className="font-medium">{currentTurnVoterName}</span>
                </p>
                <form action={skipDraftTurnForBracket}>
                  <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700">
                    Skip turn
                  </button>
                </form>
              </div>
            )}

            <form action={closeNominationsForBracket}>
              <button
                type="submit"
                disabled={bracket.movies.length < 2}
                className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                Close nominations & move to seeding
              </button>
            </form>
          </div>
        )}

        {bracket.status === "SEEDING" && (
          <div className="mt-3 flex flex-col gap-3">
            <ul className="text-sm">
              {bracket.movies.map((m) => (
                <li key={m.id}>
                  {m.title} — {m.seedVotes.length} rating(s)
                </li>
              ))}
            </ul>
            <form action={closeSeedingForBracket}>
              <button
                type="submit"
                className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                Close seeding & generate bracket
              </button>
            </form>
          </div>
        )}

        {bracket.status === "ACTIVE" && currentRoundData && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm font-medium">Round {bracket.currentRound}</p>
            <ul className="flex flex-col gap-2">
              {currentRoundData.matchups.map((m) => (
                <li key={m.id} className="rounded border border-neutral-200 p-2 text-sm dark:border-neutral-800">
                  {m.movieA?.title ?? "TBD"} vs {m.movieB?.title ?? "TBD"} —{" "}
                  <span className="font-medium">{m.status}</span>
                  {m.status === "RESOLVED" && m.winnerMovie && <> · winner: {m.winnerMovie.title}</>}
                  {m.status === "NEEDS_MANUAL_TIEBREAK" && (
                    <div className="mt-2 flex gap-2">
                      <form action={resolveTiebreakCoinFlip.bind(null, m.id)}>
                        <button type="submit" className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700">
                          Coin flip
                        </button>
                      </form>
                      <form action={reopenForRevote.bind(null, m.id)}>
                        <button type="submit" className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700">
                          Reopen for revote
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <form action={closeRoundForBracket}>
              <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900">
                Close round & advance
              </button>
            </form>
          </div>
        )}

        {bracket.status === "COMPLETE" && (
          <p className="mt-3 text-sm text-neutral-500">
            🏆 The bracket is complete
            {bracket.rounds.at(-1)?.matchups[0]?.winnerMovie
              ? ` — ${bracket.rounds.at(-1)!.matchups[0].winnerMovie!.title} wins!`
              : "."}
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Share this link</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Send everyone to <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">/b/{bracket.slug}</code>{" "}
          to nominate and vote. Project <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">/b/{bracket.slug}/tv</code>{" "}
          on the TV.
        </p>
      </section>
    </main>
  );
}
