"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { CharacterSearch, type CharacterSearchResult } from "./CharacterSearch";

// Mirrors MovieSearchSheet.tsx — a bottom-sheet takeover around CharacterSearch.
export function CharacterSearchSheet({
  onPick,
  disabled,
  excludePersonIds,
  triggerLabel = "+ Search for an actor",
}: {
  onPick: (person: CharacterSearchResult) => void;
  disabled?: boolean;
  excludePersonIds?: number[];
  triggerLabel?: string;
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
        {triggerLabel}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <CharacterSearch
          disabled={disabled}
          excludePersonIds={excludePersonIds}
          onPick={(person) => {
            onPick(person);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </>
  );
}
