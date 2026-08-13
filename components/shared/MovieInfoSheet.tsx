"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { TrailerEmbed } from "@/components/shared/TrailerEmbed";

export interface MovieInfoSheetMovie {
  title: string;
  posterUrl: string | null;
  overview: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  runtime: number | null;
  trailerKey: string | null;
}

// A refresher on an already-nominated movie, for a phone-sized "what was
// that one again?" lookup — a bottom sheet rather than the TV's full-screen
// takeover style, which is reserved for the TV's own "big moments" and would
// be too heavy for this. No modal/dialog primitive exists elsewhere in this
// codebase yet, so this is a new one.
export function MovieInfoSheet({ movie, onClose }: { movie: MovieInfoSheetMovie | null; onClose: () => void }) {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <AnimatePresence onExitComplete={() => setShowTrailer(false)}>
      {movie && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/70"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface p-5"
          >
            <button type="button" onClick={onClose} className="mb-3 ml-auto block text-cream-dim">
              ✕ Close
            </button>
            <div className="flex gap-4">
              {movie.posterUrl && (
                <Image src={movie.posterUrl} alt="" width={100} height={150} className="shrink-0 rounded-md" />
              )}
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl tracking-wide text-gold uppercase">{movie.title}</h2>
                <p className="text-sm text-cream-dim">
                  {movie.releaseYear ?? "—"} · ⭐ {movie.voteAverage?.toFixed(1) ?? "—"}
                  {movie.runtime ? ` · ${movie.runtime} min` : ""}
                </p>
              </div>
            </div>
            {movie.overview && <p className="mt-4 text-sm text-cream">{movie.overview}</p>}
            {movie.trailerKey && !showTrailer && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="mt-4 rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim"
              >
                ▶ Watch trailer
              </button>
            )}
            {movie.trailerKey && showTrailer && (
              <div className="mt-4">
                <TrailerEmbed trailerKey={movie.trailerKey} startMuted={false} />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
