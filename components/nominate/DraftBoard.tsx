"use client";

import useSWR from "swr";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MovieSearchResult } from "./MovieSearch";
import { MovieSearchSheet } from "./MovieSearchSheet";
import { CharacterNominationEntry, type CharacterNominationPayload } from "./CharacterNominationEntry";
import { submitDraftPick, submitCharacterDraftPick } from "@/app/b/[slug]/draft/actions";
import { Avatar } from "@/components/shared/Avatar";
import { PickAnnouncement } from "@/components/shared/PickAnnouncement";
import { PosterButton } from "@/components/shared/PosterButton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateResponse {
  bracket: {
    status: string;
    contentType: "MOVIE" | "CHARACTER";
    characterName: string | null;
    poolTargetSize: number | null;
    hasFilters: boolean;
    filterSummary: string | null;
  };
  movies: {
    id: string;
    tmdbId: number;
    title: string;
    posterUrl: string | null;
    overview: string | null;
    voteAverage: number | null;
    releaseYear: number | null;
    runtime: number | null;
    trailerKey: string | null;
    filmTitle: string | null;
    filmYear: number | null;
    nominatedByName: string | null;
    nominatedByAvatar: string | null;
  }[];
  draft: {
    currentVoterId: string | null;
    currentVoterName: string | null;
    nextVoterName: string | null;
  } | null;
}

export function DraftBoard({
  bracketId,
  slug,
  voterName,
}: {
  bracketId: string;
  slug: string;
  voterName: string;
}) {
  const { data, mutate } = useSWR<StateResponse>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 4000,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  if (!data) return <p className="text-cream-dim">Loading…</p>;

  if (data.bracket.status !== "NOMINATING") {
    return <p className="text-cream-dim">The draft has finished — on to seeding next.</p>;
  }
  if (!data.draft) {
    return <p className="text-cream-dim">Waiting for the admin to start the draft…</p>;
  }

  const isMyTurn = data.draft.currentVoterName === voterName;
  const isUpNext = !isMyTurn && data.draft.nextVoterName === voterName;
  const movies = data.movies;

  async function handlePick(movie: MovieSearchResult) {
    setError(null);
    setIsPicking(true);
    try {
      const result = await submitDraftPick(bracketId, movie);
      if (result.error) setError(result.error);
      // Awaited so the draft board and pool are guaranteed to reflect the
      // new pick before this handler returns — see OpenNominationPanel for
      // why a fire-and-forget mutate() here was the likely cause of the pool
      // sometimes not updating until an unrelated interaction.
      await mutate();
    } finally {
      setIsPicking(false);
    }
  }

  async function handleCharacterPick(payload: CharacterNominationPayload) {
    setError(null);
    setIsPicking(true);
    try {
      const result = await submitCharacterDraftPick(bracketId, payload);
      if (result.error) setError(result.error);
      await mutate();
    } finally {
      setIsPicking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={data.draft.currentVoterId ?? "none"}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className={`rounded-lg border p-3 text-center ${
            isMyTurn
              ? "animate-pulse border-gold bg-gold/10 shadow-[0_0_30px_-6px_rgba(232,163,61,0.5)]"
              : "border-gold/20 bg-surface"
          }`}
        >
          {isMyTurn ? (
            <p className="font-display text-lg tracking-wide text-gold uppercase">
              It&apos;s your turn — {data.bracket.contentType === "CHARACTER" ? "pick an actor!" : "pick a movie!"}
            </p>
          ) : (
            <p>
              Waiting on <span className="font-medium text-gold">{data.draft.currentVoterName}</span>…
            </p>
          )}
          <p className="mt-1 text-sm text-cream-dim">
            {movies.length}
            {data.bracket.poolTargetSize && ` / ${data.bracket.poolTargetSize}`} picked
          </p>
        </motion.div>
      </AnimatePresence>

      {isUpNext && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-cream-dim"
        >
          🎬 You&apos;re up next — get ready!
        </motion.p>
      )}

      <PickAnnouncement movies={movies} />

      {data.bracket.filterSummary && (
        <p className="text-center text-sm text-cream-dim">
          Search is scoped to: <span className="font-medium text-gold">{data.bracket.filterSummary}</span>
        </p>
      )}

      {isMyTurn &&
        (data.bracket.contentType === "CHARACTER" ? (
          <CharacterNominationEntry
            bracketId={bracketId}
            onSubmit={handleCharacterPick}
            disabled={isPicking}
            excludePersonIds={movies.map((m) => m.tmdbId)}
            triggerLabel={
              data.bracket.characterName ? `+ Pick an actor for ${data.bracket.characterName}` : "+ Pick an actor"
            }
          />
        ) : (
          <MovieSearchSheet
            bracketId={bracketId}
            onPick={handlePick}
            disabled={isPicking}
            excludeTmdbIds={movies.map((m) => m.tmdbId)}
            hasFilters={data.bracket.hasFilters}
          />
        ))}
      {error && <p className="text-sm text-error">{error}</p>}

      <div>
        <h2 className="font-display text-lg tracking-wide text-rose uppercase">Draft board</h2>
        <ul className="mt-2 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {movies.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="flex items-center gap-3 rounded-lg bg-surface p-2 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.7)]"
              >
                <PosterButton
                  movie={m}
                  width={48}
                  height={72}
                  imageClassName="rounded shadow-[0_4px_10px_-4px_rgba(0,0,0,0.7)]"
                  placeholderClassName="h-[72px] w-12 shrink-0 rounded bg-surface-raised"
                />
                <span className="flex items-center gap-1.5">
                  {m.title}
                  {m.nominatedByName && (
                    <span className="flex items-center gap-1 text-sm text-cream-dim">
                      — picked by <Avatar name={m.nominatedByName} avatar={m.nominatedByAvatar} size="sm" />
                      {m.nominatedByName}
                    </span>
                  )}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
