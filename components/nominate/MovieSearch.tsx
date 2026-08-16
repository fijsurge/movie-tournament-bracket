"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/shared/Spinner";
import { MovieInfoSheet, type MovieInfoSheetMovie } from "@/components/shared/MovieInfoSheet";

export interface MovieSearchResult {
  tmdbId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
}

interface MovieDetailsResponse {
  overview: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  runtime: number | null;
  trailerKey: string | null;
  director: string | null;
  cast: string[] | null;
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
  const [previewMovie, setPreviewMovie] = useState<MovieSearchResult | null>(null);
  const [previewDetails, setPreviewDetails] = useState<MovieDetailsResponse | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ bracketId, q: query });
      fetch(`/api/movies/search?${params}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query, bracketId]);

  function openPreview(movie: MovieSearchResult) {
    setPreviewMovie(movie);
    setPreviewDetails(null);
    fetch(`/api/movies/${movie.tmdbId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setPreviewDetails)
      .catch(() => setPreviewDetails(null));
  }

  const previewSheetMovie: MovieInfoSheetMovie | null = previewMovie
    ? {
        title: previewMovie.title,
        posterUrl: previewMovie.posterUrl,
        overview: previewDetails?.overview ?? null,
        voteAverage: previewDetails?.voteAverage ?? null,
        releaseYear: previewDetails?.releaseYear ?? (previewMovie.year ? Number(previewMovie.year) : null),
        runtime: previewDetails?.runtime ?? null,
        trailerKey: previewDetails?.trailerKey ?? null,
        director: previewDetails?.director ?? null,
        cast: previewDetails?.cast ?? null,
      }
    : null;
  const previewAlreadyAdded = previewMovie ? excludeTmdbIds.includes(previewMovie.tmdbId) : false;

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={hasFilters ? "Search within the filtered list…" : "Search, or browse popular movies…"}
        disabled={disabled}
        className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none disabled:opacity-50"
      />
      {loading && (
        <p className="flex items-center gap-2 text-sm text-cream-dim">
          <Spinner className="h-4 w-4" /> Searching…
        </p>
      )}
      {results.length > 0 && (
        <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {results.map((movie) => {
            const alreadyAdded = excludeTmdbIds.includes(movie.tmdbId);
            return (
              <li
                key={movie.tmdbId}
                className="flex items-center gap-3 rounded-lg bg-surface p-2 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-8px_rgba(232,163,61,0.25)]"
              >
                <button
                  type="button"
                  onClick={() => openPreview(movie)}
                  className="shrink-0 transition active:scale-95"
                >
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt=""
                      width={48}
                      height={72}
                      className="rounded shadow-[0_4px_10px_-4px_rgba(0,0,0,0.7)]"
                    />
                  ) : (
                    <div className="h-[72px] w-12 shrink-0 rounded bg-surface-raised" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={disabled || alreadyAdded}
                  onClick={() => {
                    onPick(movie);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex-1 text-left active:scale-[0.98] disabled:opacity-40"
                >
                  {movie.title} {movie.year && <span className="text-cream-dim">({movie.year})</span>}
                  {alreadyAdded && <span className="ml-2 text-xs text-cream-dim">already in pool</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <MovieInfoSheet
        movie={previewSheetMovie}
        onClose={() => setPreviewMovie(null)}
        actionLabel={previewAlreadyAdded ? undefined : "+ Nominate this movie"}
        onAction={
          previewAlreadyAdded || disabled
            ? undefined
            : () => {
                if (previewMovie) onPick(previewMovie);
                setPreviewMovie(null);
                setQuery("");
                setResults([]);
              }
        }
      />
    </div>
  );
}
