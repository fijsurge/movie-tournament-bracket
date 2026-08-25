import Image from "next/image";
import { notFound } from "next/navigation";
import { requireBracketAdmin } from "@/lib/bracket-auth";
import { prisma } from "@/lib/db";
import { getBaseUrl } from "@/lib/base-url";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminPhaseWatcher } from "@/components/admin/AdminPhaseWatcher";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar } from "@/components/shared/Avatar";
import { ShareLink } from "@/components/admin/ShareLink";
import { InviteVoters } from "@/components/admin/InviteVoters";
import { UndoButton } from "@/components/admin/UndoButton";
import { QuickSeedButton } from "@/components/admin/QuickSeedButton";
import { DeleteBracketButton } from "@/components/admin/DeleteBracketButton";
import { AdminAddMovie } from "@/components/admin/AdminAddMovie";
import { AdminAddCharacter } from "@/components/admin/AdminAddCharacter";
import { ClearPoolButton } from "@/components/admin/ClearPoolButton";
import { buildFilterSummary } from "@/lib/bracket-filters";
import { effectiveVoterName, effectiveVoterAvatar } from "@/lib/voter-display";
import {
  openNominations,
  startDraft,
  skipDraftTurn,
  closeNominations,
  closeSeeding,
  quickSeed,
  closeRound,
  resolveTiebreakCoinFlip,
  reopenForRevote,
  toggleAutoAdvance,
  toggleEmailNotifications,
  toggleScoring,
  undoLastPhase,
  toggleArchived,
  deleteBracket,
  promoteVoter,
  demoteVoter,
  clearNominationPool,
} from "./actions";

const PRIMARY_BUTTON =
  "rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50";
const SECONDARY_BUTTON =
  "rounded-full border border-gold/40 px-3 py-1 text-sm text-cream transition hover:border-gold active:scale-95 disabled:opacity-50";

export default async function AdminBracketDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = await getBaseUrl();

  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { order: "asc" } },
      movies: {
        include: { nominatedByVoter: { include: { person: true } }, seedVotes: true },
        orderBy: { createdAt: "asc" },
      },
      voters: { include: { person: true } },
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

  await requireBracketAdmin(bracket.id);

  const openNominationsForBracket = openNominations.bind(null, bracket.id);
  const startDraftForBracket = startDraft.bind(null, bracket.id);
  const skipDraftTurnForBracket = skipDraftTurn.bind(null, bracket.id);
  const closeNominationsForBracket = closeNominations.bind(null, bracket.id);
  const closeSeedingForBracket = closeSeeding.bind(null, bracket.id);
  const quickSeedForBracket = quickSeed.bind(null, bracket.id);
  const closeRoundForBracket = closeRound.bind(null, bracket.id);
  const toggleAutoAdvanceForBracket = toggleAutoAdvance.bind(null, bracket.id);
  const toggleEmailNotificationsForBracket = toggleEmailNotifications.bind(null, bracket.id);
  const toggleScoringForBracket = toggleScoring.bind(null, bracket.id);
  const undoLastPhaseForBracket = undoLastPhase.bind(null, bracket.id);
  const toggleArchivedForBracket = toggleArchived.bind(null, bracket.id);
  const deleteBracketForBracket = deleteBracket.bind(null, bracket.id);
  const clearNominationPoolForBracket = clearNominationPool.bind(null, bracket.id);

  const currentRoundData = bracket.rounds.find((r) => r.roundNumber === bracket.currentRound);

  const { filterSummary, hasFilters } = buildFilterSummary(bracket);
  const poolEditable = bracket.status === "SETUP" || bracket.status === "NOMINATING";

  const turnOrder = bracket.draftState ? (JSON.parse(bracket.draftState.turnOrder) as string[]) : [];
  const votersById = new Map(bracket.voters.map((v) => [v.id, effectiveVoterName(v)]));
  const currentTurnVoterName = bracket.draftState
    ? (votersById.get(turnOrder[bracket.draftState.currentTurnIndex % turnOrder.length]) ?? "Unknown")
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <AdminNav bracketSlug={bracket.slug} />
      <AdminPhaseWatcher slug={bracket.slug} />
      <h1 className="font-display text-3xl tracking-wide text-gold uppercase">{bracket.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <StatusBadge status={bracket.status} />
        {bracket.archived && (
          <span className="rounded-full border border-cream-dim/30 px-2.5 py-1 text-xs text-cream-dim">
            Archived
          </span>
        )}
        <span className="text-sm text-cream-dim">
          Nomination mode: <span className="font-medium text-cream">{bracket.nominationMode}</span>
        </span>
        {bracket.status !== "SETUP" && bracket.status !== "COMPLETE" && (
          <form action={toggleAutoAdvanceForBracket}>
            <SubmitButton
              pendingLabel="…"
              className={`rounded-full border px-3 py-1 text-xs transition active:scale-95 ${
                bracket.autoAdvance
                  ? "border-gold/50 bg-gold/10 text-gold hover:border-gold active:border-gold"
                  : "border-cream-dim/30 text-cream-dim hover:border-cream-dim/60 active:border-cream-dim/60"
              }`}
            >
              Auto-advance: {bracket.autoAdvance ? "On" : "Paused"}
            </SubmitButton>
          </form>
        )}
        <form action={toggleEmailNotificationsForBracket}>
          <SubmitButton
            pendingLabel="…"
            className={`rounded-full border px-3 py-1 text-xs transition active:scale-95 ${
              bracket.emailNotificationsEnabled
                ? "border-gold/50 bg-gold/10 text-gold hover:border-gold active:border-gold"
                : "border-cream-dim/30 text-cream-dim hover:border-cream-dim/60 active:border-cream-dim/60"
            }`}
          >
            Draft turn emails: {bracket.emailNotificationsEnabled ? "On" : "Off"}
          </SubmitButton>
        </form>
        {bracket.nominationMode === "DRAFT" && (
          <form action={toggleScoringForBracket}>
            <SubmitButton
              pendingLabel="…"
              className={`rounded-full border px-3 py-1 text-xs transition active:scale-95 ${
                bracket.scoringEnabled
                  ? "border-gold/50 bg-gold/10 text-gold hover:border-gold active:border-gold"
                  : "border-cream-dim/30 text-cream-dim hover:border-cream-dim/60 active:border-cream-dim/60"
              }`}
            >
              Points competition: {bracket.scoringEnabled ? "On" : "Off"}
            </SubmitButton>
          </form>
        )}
      </div>

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

      {filterSummary && (
        <section className="mt-6">
          <h2 className="text-lg font-medium text-rose">Search filter</h2>
          <p className="mt-1 text-sm text-cream-dim">{filterSummary}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-medium text-rose">Bracket admins</h2>
        {bracket.voters.length === 0 ? (
          <p className="mt-2 text-sm text-cream-dim">No voters yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {bracket.voters.map((v) => {
              const isBracketAdminVoter = v.role === "ADMIN";
              const canPromote = Boolean(v.person?.emailVerifiedAt);
              return (
                <li key={v.id} className="flex items-center justify-between gap-3 rounded border border-gold/15 p-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <Avatar name={effectiveVoterName(v)} avatar={effectiveVoterAvatar(v)} size="sm" />
                    <span className="truncate">{effectiveVoterName(v)}</span>
                    {isBracketAdminVoter && (
                      <span className="shrink-0 rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold">
                        Admin
                      </span>
                    )}
                  </span>
                  {isBracketAdminVoter ? (
                    <form action={demoteVoter.bind(null, bracket.id, v.id)} className="shrink-0">
                      <SubmitButton pendingLabel="…" className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}>
                        Remove admin
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={promoteVoter.bind(null, bracket.id, v.id)} className="shrink-0">
                      <SubmitButton
                        pendingLabel="…"
                        disabled={!canPromote}
                        title={canPromote ? undefined : "Needs a verified email to become admin"}
                        className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}
                      >
                        Make admin
                      </SubmitButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {poolEditable && (
        <section className="mt-6 rounded border border-gold/20 bg-surface p-4">
          <h2 className="text-lg font-medium text-rose">
            {bracket.contentType === "CHARACTER" ? "Actor pool" : "Movie pool"}
          </h2>
          <p className="mt-1 text-sm text-cream-dim">
            {bracket.movies.length} {bracket.contentType === "CHARACTER" ? "actor(s)" : "movie(s)"} in the pool.
          </p>

          {bracket.contentType === "CHARACTER" && bracket.movies.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {bracket.movies.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded border border-gold/10 p-2 text-sm">
                  {m.posterUrl ? (
                    <Image
                      src={m.posterUrl}
                      alt=""
                      width={36}
                      height={54}
                      className="shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-[54px] w-9 shrink-0 rounded bg-surface-raised" />
                  )}
                  <span className="min-w-0">
                    <span className="font-medium">{m.title}</span>
                    {bracket.characterName && <span className="text-cream-dim"> as {bracket.characterName}</span>}
                    {m.filmTitle && (
                      <span className="block truncate text-xs text-cream-dim">
                        {m.filmTitle}
                        {m.filmYear ? ` (${m.filmYear})` : ""}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-col gap-3">
            {bracket.contentType === "CHARACTER" ? (
              <AdminAddCharacter
                bracketId={bracket.id}
                excludePersonIds={bracket.movies.map((m) => m.tmdbId)}
                characterName={bracket.characterName}
              />
            ) : (
              <AdminAddMovie
                bracketId={bracket.id}
                excludeTmdbIds={bracket.movies.map((m) => m.tmdbId)}
                hasFilters={hasFilters}
              />
            )}
            <ClearPoolButton
              action={clearNominationPoolForBracket}
              disabled={bracket.movies.length === 0}
              className={`${SECONDARY_BUTTON} self-start`}
            />
          </div>
        </section>
      )}

      <section className="mt-6 rounded border border-gold/20 bg-surface p-4">
        <h2 className="text-lg font-medium text-rose">Bracket controls</h2>

        {bracket.status === "SETUP" && (
          <form action={openNominationsForBracket} className="mt-3">
            <SubmitButton pendingLabel="Opening…" className={PRIMARY_BUTTON}>
              Open nominations
            </SubmitButton>
          </form>
        )}

        {bracket.status === "NOMINATING" && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm">
              {bracket.movies.length} movie(s) nominated · {bracket.voters.length} voter(s) joined
            </p>

            {bracket.voters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bracket.voters.map((v) => (
                  <span
                    key={v.id}
                    className="flex items-center gap-1.5 rounded-full border border-gold/15 bg-surface py-1 pr-3 pl-1 text-sm"
                  >
                    <Avatar name={effectiveVoterName(v)} avatar={effectiveVoterAvatar(v)} size="sm" />
                    {effectiveVoterName(v)}
                  </span>
                ))}
              </div>
            )}

            {bracket.nominationMode === "DRAFT" && !bracket.draftState && (
              <div>
                <form action={startDraftForBracket}>
                  <SubmitButton
                    disabled={bracket.voters.length < 1}
                    pendingLabel="Starting…"
                    className={PRIMARY_BUTTON}
                  >
                    Start draft
                  </SubmitButton>
                </form>
              </div>
            )}

            {bracket.nominationMode === "DRAFT" && bracket.draftState && (
              <div className="flex items-center gap-3">
                <p className="min-w-0 truncate text-sm">
                  Current turn: <span className="font-medium text-gold">{currentTurnVoterName}</span>
                </p>
                <form action={skipDraftTurnForBracket} className="shrink-0">
                  <SubmitButton pendingLabel="…" className={SECONDARY_BUTTON}>
                    Skip turn
                  </SubmitButton>
                </form>
              </div>
            )}

            <form action={closeNominationsForBracket}>
              <SubmitButton
                disabled={bracket.movies.length < 2}
                pendingLabel="Closing…"
                className={PRIMARY_BUTTON}
              >
                Close nominations & move to seeding
              </SubmitButton>
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
              <SubmitButton pendingLabel="Generating…" className={PRIMARY_BUTTON}>
                Close seeding & generate bracket
              </SubmitButton>
            </form>
            <QuickSeedButton action={quickSeedForBracket} className={SECONDARY_BUTTON} />
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
                        <SubmitButton pendingLabel="Flipping…" className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}>
                          Coin flip
                        </SubmitButton>
                      </form>
                      <form action={reopenForRevote.bind(null, m.id)}>
                        <SubmitButton pendingLabel="Reopening…" className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}>
                          Reopen for revote
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <form action={closeRoundForBracket}>
              <SubmitButton pendingLabel="Closing round…" className={PRIMARY_BUTTON}>
                Close round & advance
              </SubmitButton>
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

        {bracket.status !== "SETUP" && (
          <UndoButton action={undoLastPhaseForBracket} className={`${SECONDARY_BUTTON} mt-3`} />
        )}
      </section>

      {bracket.status !== "COMPLETE" && (
        <InviteVoters
          bracketId={bracket.id}
          invitedVoters={bracket.voters
            .filter((v): v is typeof v & { email: string } => v.email !== null)
            .map((v) => ({ id: v.id, name: effectiveVoterName(v), email: v.email, avatar: effectiveVoterAvatar(v) }))}
        />
      )}

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="text-lg font-medium text-rose">Share this link</h2>
        <ShareLink url={`${baseUrl}/b/${bracket.slug}`} label="Send to your group — nominate & vote" />
        <ShareLink url={`${baseUrl}/b/${bracket.slug}/tv`} label="Project this on the TV" />
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded border border-error/30 p-4">
        <h2 className="text-lg font-medium text-error">Danger zone</h2>
        <div className="flex flex-wrap items-center gap-3">
          <form action={toggleArchivedForBracket}>
            <SubmitButton pendingLabel="…" className={SECONDARY_BUTTON}>
              {bracket.archived ? "Unarchive" : "Archive"}
            </SubmitButton>
          </form>
          <p className="text-xs text-cream-dim">
            {bracket.archived
              ? "Hidden from the home page and your bracket list. Data is untouched."
              : "Hides this bracket from lists without deleting anything — reversible any time."}
          </p>
        </div>
        <DeleteBracketButton
          action={deleteBracketForBracket}
          bracketName={bracket.name}
          className="self-start rounded-full border border-error/50 px-4 py-2 text-sm text-error transition hover:bg-error/10 active:scale-95 disabled:opacity-50"
        />
      </section>
    </main>
  );
}
