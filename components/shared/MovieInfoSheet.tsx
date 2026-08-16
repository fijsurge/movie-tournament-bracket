"use client";

import { useState } from "react";
import Image from "next/image";
import { TrailerEmbed } from "@/components/shared/TrailerEmbed";
import { BottomSheet } from "@/components/shared/BottomSheet";

export interface MovieInfoSheetMovie {
  title: string;
  posterUrl: string | null;
  overview: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  runtime: number | null;
  trailerKey: string | null;
  filmTitle?: string | null;
  filmYear?: number | null;
  director?: string | null;
  cast?: string[] | null;
}

// A refresher on an already-nominated movie, for a phone-sized "what was
// that one again?" lookup — a bottom sheet rather than the TV's full-screen
// takeover style, which is reserved for the TV's own "big moments" and would
// be too heavy for this. `actionLabel`/`onAction` are optional — only the
// nomination-search preview passes them (for "+ Nominate this movie");
// every other caller stays read-only.
export function MovieInfoSheet({
  movie,
  onClose,
  actionLabel,
  onAction,
}: {
  movie: MovieInfoSheetMovie | null;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <BottomSheet open={movie !== null} onClose={onClose} onExitComplete={() => setShowTrailer(false)}>
      {movie && (
        <>
          <button
            type="button"
            onClick={onClose}
            className="mb-3 ml-auto block text-cream-dim transition active:scale-95"
          >
            ✕ Close
          </button>
          <div className="flex gap-4">
            {movie.posterUrl && (
              <Image src={movie.posterUrl} alt="" width={100} height={150} className="shrink-0 rounded-md" />
            )}
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl tracking-wide text-gold uppercase">{movie.title}</h2>
              {(movie.releaseYear || movie.voteAverage) && (
                <p className="text-sm text-cream-dim">
                  {movie.releaseYear ?? "—"} · ⭐ {movie.voteAverage?.toFixed(1) ?? "—"}
                  {movie.runtime ? ` · ${movie.runtime} min` : ""}
                </p>
              )}
              {movie.filmTitle && (
                <p className="text-sm text-cream-dim">
                  as seen in {movie.filmTitle}
                  {movie.filmYear ? ` (${movie.filmYear})` : ""}
                </p>
              )}
              {movie.director && <p className="text-sm text-cream-dim">Directed by {movie.director}</p>}
              {movie.cast && movie.cast.length > 0 && (
                <p className="text-sm text-cream-dim">Starring {movie.cast.join(", ")}</p>
              )}
            </div>
          </div>
          {movie.overview && <p className="mt-4 text-sm text-cream">{movie.overview}</p>}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mt-4 w-full rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95"
            >
              {actionLabel}
            </button>
          )}
          {movie.trailerKey && !showTrailer && (
            <button
              type="button"
              onClick={() => setShowTrailer(true)}
              className="mt-4 rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95"
            >
              ▶ Watch trailer
            </button>
          )}
          {movie.trailerKey && showTrailer && (
            <div className="mt-4">
              <TrailerEmbed trailerKey={movie.trailerKey} startMuted={false} />
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
