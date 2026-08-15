"use client";

import useSWR from "swr";
import { useState } from "react";
import type { MovieSearchResult } from "./MovieSearch";
import { MovieSearchSheet } from "./MovieSearchSheet";
import { CharacterNominationEntry, type CharacterNominationPayload } from "./CharacterNominationEntry";
import { submitNomination, submitCharacterNomination } from "@/app/b/[slug]/nominate/actions";
import { Avatar } from "@/components/shared/Avatar";
import { PickAnnouncement } from "@/components/shared/PickAnnouncement";
import { PosterButton } from "@/components/shared/PosterButton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateResponse {
  bracket: {
    status: string;
    contentType: "MOVIE" | "CHARACTER";
    characterName: string | null;
    nominationCapPerVoter: number | null;
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
}

export function OpenNominationPanel({
  bracketId,
  slug,
  voterName,
}: {
  bracketId: string;
  slug: string;
  voterName: string;
}) {
  const { data, mutate } = useSWR<StateResponse>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const movies = data?.movies ?? [];
  const cap = data?.bracket.nominationCapPerVoter ?? null;
  const myCount = movies.filter((m) => m.nominatedByName === voterName).length;
  const atCap = cap !== null && myCount >= cap;

  async function handlePick(movie: MovieSearchResult) {
    setError(null);
    setIsPicking(true);
    try {
      const result = await submitNomination(bracketId, movie);
      if (result.error) {
        setError(result.error);
      }
      // Awaited (not fire-and-forget) so the newly nominated movie is
      // guaranteed to be in `data` before this handler returns — a bare
      // `mutate()` call left unawaited inside a transition previously meant
      // the pool list's update could sit pending until some unrelated
      // interaction forced React to flush it.
      await mutate();
    } finally {
      setIsPicking(false);
    }
  }

  async function handleCharacterPick(payload: CharacterNominationPayload) {
    setError(null);
    setIsPicking(true);
    try {
      const result = await submitCharacterNomination(bracketId, payload);
      if (result.error) {
        setError(result.error);
      }
      await mutate();
    } finally {
      setIsPicking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cream-dim">
        Hi {voterName} — you&apos;ve nominated {myCount}
        {cap !== null && ` of ${cap}`}.
      </p>

      {atCap ? (
        <p className="text-sm text-cream-dim">You&apos;ve used all your nominations. Waiting on everyone else…</p>
      ) : data?.bracket.contentType === "CHARACTER" ? (
        <CharacterNominationEntry
          bracketId={bracketId}
          onSubmit={handleCharacterPick}
          disabled={isPicking}
          excludePersonIds={movies.map((m) => m.tmdbId)}
          triggerLabel={
            data.bracket.characterName ? `+ Nominate an actor for ${data.bracket.characterName}` : "+ Nominate an actor"
          }
        />
      ) : (
        <MovieSearchSheet
          bracketId={bracketId}
          onPick={handlePick}
          disabled={isPicking}
          excludeTmdbIds={movies.map((m) => m.tmdbId)}
          hasFilters={data?.bracket.hasFilters ?? false}
        />
      )}
      {error && <p className="text-sm text-error">{error}</p>}

      <PickAnnouncement movies={movies} />

      {data?.bracket.filterSummary && (
        <p className="text-sm text-cream-dim">
          Search is scoped to: <span className="font-medium text-gold">{data.bracket.filterSummary}</span>
        </p>
      )}

      <div>
        <h2 className="font-display text-lg tracking-wide text-rose uppercase">Pool so far ({movies.length})</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {movies.map((m) => (
            <li
              key={m.id}
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
                    — nominated by <Avatar name={m.nominatedByName} avatar={m.nominatedByAvatar} size="sm" />
                    {m.nominatedByName}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
