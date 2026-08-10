"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface MovieSearchResult {
  tmdbId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
}

export function MovieSearch({
  bracketId,
  onPick,
  disabled,
  excludeTmdbIds = [],
  hasFilters = false,
}: {
  bracketId: string;
  onPick: (movie: MovieSearchResult) => void;
  disabled?: boolean;
  excludeTmdbIds?: number[];
  hasFilters?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      // With no filters configured, an empty query has nothing meaningful to
      // browse (all of TMDb), so skip the request until the user types.
      if (!hasFilters && !query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({ bracketId, q: query });
      fetch(`/api/movies/search?${params}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query, bracketId, hasFilters]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={hasFilters ? "Search within the filtered list…" : "Search for a movie…"}
        disabled={disabled}
        className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none disabled:opacity-50"
      />
      {loading && <p className="text-sm text-cream-dim">Searching…</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((movie) => {
            const alreadyAdded = excludeTmdbIds.includes(movie.tmdbId);
            return (
              <li key={movie.tmdbId}>
                <button
                  type="button"
                  disabled={disabled || alreadyAdded}
                  onClick={() => {
                    onPick(movie);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-3 rounded border border-gold/15 p-2 text-left transition hover:border-gold/40 hover:bg-surface disabled:opacity-40"
                >
                  {movie.posterUrl ? (
                    <Image src={movie.posterUrl} alt="" width={40} height={60} className="rounded" />
                  ) : (
                    <div className="h-[60px] w-10 shrink-0 rounded bg-surface-raised" />
                  )}
                  <span>
                    {movie.title} {movie.year && <span className="text-cream-dim">({movie.year})</span>}
                    {alreadyAdded && <span className="ml-2 text-xs text-cream-dim">already in pool</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
