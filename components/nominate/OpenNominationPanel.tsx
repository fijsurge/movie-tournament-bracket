"use client";

import useSWR from "swr";
import { useState, useTransition } from "react";
import Image from "next/image";
import { MovieSearch, type MovieSearchResult } from "./MovieSearch";
import { submitNomination } from "@/app/b/[slug]/nominate/actions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateResponse {
  bracket: {
    status: string;
    nominationCapPerVoter: number | null;
    hasFilters: boolean;
    filterSummary: string | null;
  };
  movies: { id: string; tmdbId: number; title: string; posterUrl: string | null; nominatedByName: string | null }[];
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
  const [pending, startTransition] = useTransition();

  const movies = data?.movies ?? [];
  const cap = data?.bracket.nominationCapPerVoter ?? null;
  const myCount = movies.filter((m) => m.nominatedByName === voterName).length;
  const atCap = cap !== null && myCount >= cap;

  function handlePick(movie: MovieSearchResult) {
    setError(null);
    startTransition(async () => {
      const result = await submitNomination(bracketId, movie);
      if (result.error) {
        setError(result.error);
      }
      mutate();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cream-dim">
        Hi {voterName} — you&apos;ve nominated {myCount}
        {cap !== null && ` of ${cap}`}.
      </p>

      {data?.bracket.filterSummary && (
        <p className="text-sm text-cream-dim">
          Search is scoped to: <span className="font-medium text-gold">{data.bracket.filterSummary}</span>
        </p>
      )}

      {atCap ? (
        <p className="text-sm text-cream-dim">You&apos;ve used all your nominations. Waiting on everyone else…</p>
      ) : (
        <MovieSearch
          bracketId={bracketId}
          onPick={handlePick}
          disabled={pending}
          excludeTmdbIds={movies.map((m) => m.tmdbId)}
          hasFilters={data?.bracket.hasFilters ?? false}
        />
      )}
      {error && <p className="text-sm text-error">{error}</p>}

      <div>
        <h2 className="font-display text-lg tracking-wide text-rose uppercase">Pool so far ({movies.length})</h2>
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
                  <span className="text-sm text-cream-dim">— nominated by {m.nominatedByName}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
