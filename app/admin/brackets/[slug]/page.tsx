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

const PRIMARY_BUTTON =
  "rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim disabled:opacity-50";
const SECONDARY_BUTTON =
  "rounded-full border border-gold/40 px-3 py-1 text-sm text-cream transition hover:border-gold disabled:opacity-50";

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
      <h1 className="font-display text-3xl tracking-wide text-gold uppercase">{bracket.name}</h1>
      <p className="mt-1 text-sm text-cream-dim">
        Status: <span className="font-medium text-cream">{bracket.status}</span> · Nomination mode:{" "}
        <span className="font-medium text-cream">{bracket.nominationMode}</span>
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-medium text-rose">Categories</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {bracket.categories.map((c) => (
            <li key={c.id} className="text-sm">
              {c.label} {c.isTiebreaker && <span className="text-cream-dim">(tiebreaker)</span>}
            </li>
          ))}
        </ul>
      </section>

      {filterParts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium text-rose">Search filter</h2>
          <p className="mt-1 text-sm text-cream-dim">{filterParts.join(" · ")}</p>
        </section>
      )}

      <section className="mt-6 rounded border border-gold/20 bg-surface p-4">
        <h2 className="text-lg font-medium text-rose">Bracket controls</h2>

        {bracket.status === "SETUP" && (
          <form action={openNominationsForBracket} className="mt-3">
            <button type="submit" className={PRIMARY_BUTTON}>
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
                <p className="mb-2 text-sm text-cream-dim">
                  Joined: {bracket.voters.map((v) => v.name).join(", ") || "no one yet"}
                </p>
                <form action={startDraftForBracket}>
                  <button type="submit" disabled={bracket.voters.length < 1} className={PRIMARY_BUTTON}>
                    Start draft
                  </button>
                </form>
              </div>
            )}

            {bracket.nominationMode === "DRAFT" && bracket.draftState && (
              <div className="flex items-center gap-3">
                <p className="text-sm">
                  Current turn: <span className="font-medium text-gold">{currentTurnVoterName}</span>
                </p>
                <form action={skipDraftTurnForBracket}>
                  <button type="submit" className={SECONDARY_BUTTON}>
                    Skip turn
                  </button>
                </form>
              </div>
            )}

            <form action={closeNominationsForBracket}>
              <button type="submit" disabled={bracket.movies.length < 2} className={PRIMARY_BUTTON}>
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
              <button type="submit" className={PRIMARY_BUTTON}>
                Close seeding & generate bracket
              </button>
            </form>
          </div>
        )}

        {bracket.status === "ACTIVE" && currentRoundData && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm font-medium text-gold">Round {bracket.currentRound}</p>
            <ul className="flex flex-col gap-2">
              {currentRoundData.matchups.map((m) => (
                <li key={m.id} className="rounded border border-gold/15 p-2 text-sm">
                  {m.movieA?.title ?? "TBD"} vs {m.movieB?.title ?? "TBD"} —{" "}
                  <span className="font-medium text-cream">{m.status}</span>
                  {m.status === "RESOLVED" && m.winnerMovie && <> · winner: {m.winnerMovie.title}</>}
                  {m.status === "NEEDS_MANUAL_TIEBREAK" && (
                    <div className="mt-2 flex gap-2">
                      <form action={resolveTiebreakCoinFlip.bind(null, m.id)}>
                        <button type="submit" className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}>
                          Coin flip
                        </button>
                      </form>
                      <form action={reopenForRevote.bind(null, m.id)}>
                        <button type="submit" className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}>
                          Reopen for revote
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <form action={closeRoundForBracket}>
              <button type="submit" className={PRIMARY_BUTTON}>
                Close round & advance
              </button>
            </form>
          </div>
        )}

        {bracket.status === "COMPLETE" && (
          <p className="mt-3 text-sm text-cream-dim">
            🏆 The bracket is complete
            {bracket.rounds.at(-1)?.matchups[0]?.winnerMovie
              ? ` — ${bracket.rounds.at(-1)!.matchups[0].winnerMovie!.title} wins!`
              : "."}
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium text-rose">Share this link</h2>
        <p className="mt-1 text-sm text-cream-dim">
          Send everyone to <code className="rounded bg-surface px-1 text-gold">/b/{bracket.slug}</code>{" "}
          to nominate and vote. Project <code className="rounded bg-surface px-1 text-gold">/b/{bracket.slug}/tv</code>{" "}
          on the TV.
        </p>
      </section>
    </main>
  );
}
