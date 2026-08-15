"use client";

import { useState } from "react";
import Image from "next/image";
import { CharacterSearchSheet } from "./CharacterSearchSheet";
import type { CharacterSearchResult } from "./CharacterSearch";
import { MovieSearchSheet } from "./MovieSearchSheet";
import type { MovieSearchResult } from "./MovieSearch";

export interface CharacterNominationPayload {
  actorTmdbId: number;
  actorName: string;
  actorPhotoUrl: string | null;
  filmTmdbId: number | null;
  filmTitle: string | null;
  filmYear: number | null;
}

// Two-step nominee entry for CHARACTER brackets: pick an actor, then
// optionally attach a representative film (reusing MovieSearchSheet as-is
// rather than a bespoke filmography browser — lets someone pick literally
// any film, not just what TMDb's credits happen to list). Shared by the
// voter nomination flow and the admin add-to-pool flow.
export function CharacterNominationEntry({
  bracketId,
  onSubmit,
  disabled,
  excludePersonIds,
  triggerLabel,
}: {
  bracketId: string;
  onSubmit: (payload: CharacterNominationPayload) => void;
  disabled?: boolean;
  excludePersonIds?: number[];
  triggerLabel?: string;
}) {
  const [pendingActor, setPendingActor] = useState<CharacterSearchResult | null>(null);

  function confirm(film: MovieSearchResult | null) {
    if (!pendingActor) return;
    onSubmit({
      actorTmdbId: pendingActor.personId,
      actorName: pendingActor.name,
      actorPhotoUrl: pendingActor.profileUrl,
      filmTmdbId: film?.tmdbId ?? null,
      filmTitle: film?.title ?? null,
      filmYear: film?.year ? Number(film.year) : null,
    });
    setPendingActor(null);
  }

  if (!pendingActor) {
    return (
      <CharacterSearchSheet
        onPick={setPendingActor}
        disabled={disabled}
        excludePersonIds={excludePersonIds}
        triggerLabel={triggerLabel}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gold/20 bg-surface p-3">
      <div className="flex items-center gap-3">
        {pendingActor.profileUrl ? (
          <Image
            src={pendingActor.profileUrl}
            alt=""
            width={40}
            height={60}
            className="rounded object-cover shadow-[0_4px_10px_-4px_rgba(0,0,0,0.7)]"
          />
        ) : (
          <div className="h-[60px] w-10 shrink-0 rounded bg-surface-raised" />
        )}
        <span className="font-medium">{pendingActor.name}</span>
      </div>
      <p className="text-sm text-cream-dim">Attach a representative film (optional)</p>
      <MovieSearchSheet
        bracketId={bracketId}
        onPick={(movie) => confirm(movie)}
        disabled={disabled}
        triggerLabel="+ Attach a film"
      />
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => confirm(null)}
          disabled={disabled}
          className="text-sm text-gold underline underline-offset-2 disabled:opacity-50"
        >
          Save without a film
        </button>
        <button
          type="button"
          onClick={() => setPendingActor(null)}
          disabled={disabled}
          className="text-sm text-cream-dim underline underline-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
