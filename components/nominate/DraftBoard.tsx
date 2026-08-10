"use client";

import useSWR from "swr";
import { useState, useTransition } from "react";
import Image from "next/image";
import { MovieSearch, type MovieSearchResult } from "./MovieSearch";
import { submitDraftPick } from "@/app/b/[slug]/draft/actions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateResponse {
  bracket: { status: string; poolTargetSize: number | null; hasFilters: boolean; filterSummary: string | null };
  movies: { id: string; tmdbId: number; title: string; posterUrl: string | null; nominatedByName: string | null }[];
  draft: {
    currentVoterName: string | null;
    participantNames: string[];
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
  const [pending, startTransition] = useTransition();

  if (!data) return <p className="text-cream-dim">Loading…</p>;

  if (data.bracket.status !== "NOMINATING") {
    return <p className="text-cream-dim">The draft has finished — on to seeding next.</p>;
  }
  if (!data.draft) {
    return <p className="text-cream-dim">Waiting for the admin to start the draft…</p>;
  }

  const isMyTurn = data.draft.currentVoterName === voterName;
  const movies = data.movies;

  function handlePick(movie: MovieSearchResult) {
    setError(null);
    startTransition(async () => {
      const result = await submitDraftPick(bracketId, movie);
      if (result.error) setError(result.error);
      mutate();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded border border-gold/20 bg-surface p-3 text-center">
        {isMyTurn ? (
          <p className="font-display text-lg tracking-wide text-gold uppercase">It&apos;s your turn — pick a movie!</p>
        ) : (
          <p>
            Waiting on <span className="font-medium text-gold">{data.draft.currentVoterName}</span>…
          </p>
        )}
        <p className="mt-1 text-sm text-cream-dim">
          {movies.length}
          {data.bracket.poolTargetSize && ` / ${data.bracket.poolTargetSize}`} picked
        </p>
      </div>

      {data.bracket.filterSummary && (
        <p className="text-center text-sm text-cream-dim">
          Search is scoped to: <span className="font-medium text-gold">{data.bracket.filterSummary}</span>
        </p>
      )}

      {isMyTurn && (
        <MovieSearch
          bracketId={bracketId}
          onPick={handlePick}
          disabled={pending}
          excludeTmdbIds={movies.map((m) => m.tmdbId)}
          hasFilters={data.bracket.hasFilters}
        />
      )}
      {error && <p className="text-sm text-error">{error}</p>}

      <div>
        <h2 className="font-display text-lg tracking-wide text-rose uppercase">Draft board</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {movies.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              {m.posterUrl ? (
                <Image src={m.posterUrl} alt="" width={32} height={48} className="rounded" />
              ) : (
                <div className="h-12 w-8 shrink-0 rounded bg-surface-raised" />
              )}
              <span>
                {m.title}{" "}
                {m.nominatedByName && (
                  <span className="text-sm text-cream-dim">— picked by {m.nominatedByName}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
