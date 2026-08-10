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

  if (!data) return <p className="text-neutral-500">Loading…</p>;

  if (data.bracket.status !== "NOMINATING") {
    return <p className="text-neutral-500">The draft has finished — on to seeding next.</p>;
  }
  if (!data.draft) {
    return <p className="text-neutral-500">Waiting for the admin to start the draft…</p>;
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
      <div className="rounded border border-neutral-200 p-3 text-center dark:border-neutral-800">
        {isMyTurn ? (
          <p className="text-lg font-medium">It&apos;s your turn — pick a movie!</p>
        ) : (
          <p>
            Waiting on <span className="font-medium">{data.draft.currentVoterName}</span>…
          </p>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          {movies.length}
          {data.bracket.poolTargetSize && ` / ${data.bracket.poolTargetSize}`} picked
        </p>
      </div>

      {data.bracket.filterSummary && (
        <p className="text-center text-sm text-neutral-500">
          Search is scoped to: <span className="font-medium">{data.bracket.filterSummary}</span>
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
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <h2 className="text-lg font-medium">Draft board</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {movies.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              {m.posterUrl ? (
                <Image src={m.posterUrl} alt="" width={32} height={48} className="rounded" />
              ) : (
                <div className="h-12 w-8 shrink-0 rounded bg-neutral-200 dark:bg-neutral-800" />
              )}
              <span>
                {m.title}{" "}
                {m.nominatedByName && (
                  <span className="text-sm text-neutral-500">— picked by {m.nominatedByName}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
