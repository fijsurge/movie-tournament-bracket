"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { submitSeedVote } from "@/app/b/[slug]/seed/actions";

interface Movie {
  id: string;
  title: string;
  posterUrl: string | null;
}

const SCORES = [1, 2, 3, 4, 5];

export function SeedRatingPanel({
  bracketId,
  movies,
  initialRatings,
}: {
  bracketId: string;
  movies: Movie[];
  initialRatings: Record<string, number>;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(initialRatings);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function rate(movieId: string, score: number) {
    setError(null);
    setRatings((prev) => ({ ...prev, [movieId]: score }));
    startTransition(async () => {
      const result = await submitSeedVote(bracketId, { movieId, score });
      if (result.error) setError(result.error);
    });
  }

  const ratedCount = Object.keys(ratings).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">
        You&apos;ve rated {ratedCount} of {movies.length} movies.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-4">
        {movies.map((movie) => (
          <li key={movie.id} className="flex items-center gap-3">
            {movie.posterUrl ? (
              <Image src={movie.posterUrl} alt="" width={40} height={60} className="rounded" />
            ) : (
              <div className="h-[60px] w-10 shrink-0 rounded bg-neutral-200 dark:bg-neutral-800" />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">{movie.title}</span>
              <div className="flex gap-1">
                {SCORES.map((score) => (
                  <button
                    key={score}
                    type="button"
                    disabled={pending}
                    onClick={() => rate(movie.id, score)}
                    aria-pressed={ratings[movie.id] === score}
                    className={`h-8 w-8 rounded border text-sm disabled:opacity-50 ${
                      ratings[movie.id] === score
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
