"use client";

import { useState } from "react";
import Image from "next/image";
import { MovieInfoSheet, type MovieInfoSheetMovie } from "@/components/shared/MovieInfoSheet";

// Wraps a poster image in a tap target that opens the movie's info sheet —
// a drop-in replacement for the plain <Image>/placeholder block each call
// site used to render, owning its own open state so nothing needs to be
// lifted into the parent component.
export function PosterButton({
  movie,
  width,
  height,
  imageClassName,
  placeholderClassName,
}: {
  movie: MovieInfoSheetMovie;
  width: number;
  height: number;
  imageClassName?: string;
  placeholderClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-left">
        {movie.posterUrl ? (
          <Image src={movie.posterUrl} alt="" width={width} height={height} className={imageClassName} />
        ) : (
          <div className={placeholderClassName} />
        )}
      </button>
      <MovieInfoSheet movie={open ? movie : null} onClose={() => setOpen(false)} />
    </>
  );
}
