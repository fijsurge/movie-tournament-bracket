"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MovieSearchSheet } from "@/components/nominate/MovieSearchSheet";
import type { MovieSearchResult } from "@/components/nominate/MovieSearch";
import { adminAddMovie } from "@/app/admin/brackets/[slug]/actions";

export function AdminAddMovie({
  bracketId,
  excludeTmdbIds,
  hasFilters,
}: {
  bracketId: string;
  excludeTmdbIds: number[];
  hasFilters: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePick(movie: MovieSearchResult) {
    setError(null);
    startTransition(async () => {
      const result = await adminAddMovie(bracketId, movie);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <MovieSearchSheet
        bracketId={bracketId}
        onPick={handlePick}
        disabled={pending}
        excludeTmdbIds={excludeTmdbIds}
        hasFilters={hasFilters}
        triggerLabel="+ Add a movie to the pool"
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
