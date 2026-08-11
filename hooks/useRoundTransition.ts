"use client";

import { useEffect, useState } from "react";

// Detects when the active round number changes and returns the new round
// number for a window before clearing. Never fires on first mount into a
// phase — only on subsequent advances (1 -> 2, 2 -> 3, ...). Same
// render-time state-adjustment pattern as useNewestPick.
export function useRoundTransition(currentRound: number | null, dismissAfterMs: number): number | null {
  const [seenRound, setSeenRound] = useState<number | null>(null);
  const [announced, setAnnounced] = useState<number | null>(null);

  if (currentRound !== null) {
    if (seenRound === null) {
      setSeenRound(currentRound);
    } else if (currentRound !== seenRound) {
      setSeenRound(currentRound);
      setAnnounced(currentRound);
    }
  }

  useEffect(() => {
    if (announced === null) return;
    const timer = setTimeout(() => setAnnounced(null), dismissAfterMs);
    return () => clearTimeout(timer);
  }, [announced, dismissAfterMs]);

  return announced;
}
