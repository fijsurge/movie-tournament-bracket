"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { MovieSearch, type MovieSearchResult } from "./MovieSearch";

// Wraps the unchanged MovieSearch in a bottom-sheet takeover instead of
// letting its results expand inline and push the rest of the page around.
export function MovieSearchSheet({
  bracketId,
  onPick,
  disabled,
  excludeTmdbIds,
  hasFilters,
}: {
  bracketId: string;
  onPick: (movie: MovieSearchResult) => void;
  disabled?: boolean;
  excludeTmdbIds?: number[];
  hasFilters?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-full bg-gold px-4 py-2.5 font-medium text-ink transition hover:bg-gold-dim active:scale-[0.98] disabled:opacity-50"
      >
        + Search for a movie
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <MovieSearch
          bracketId={bracketId}
          disabled={disabled}
          excludeTmdbIds={excludeTmdbIds}
          hasFilters={hasFilters}
          onPick={(movie) => {
            onPick(movie);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </>
  );
}
