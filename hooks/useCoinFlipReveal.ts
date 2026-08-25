"use client";

import { useEffect, useState } from "react";
import type { BracketStateMatchup } from "@/types/bracket";

// Detects the newest matchup resolved via a coin flip and returns it for a
// window before clearing — same render-time state-adjustment pattern as
// useNewestPick/useRoundTransition. Never fires for matchups already
// coin-flip-resolved on first mount (nothing to "reveal" retroactively,
// e.g. loading the page fresh) — only one that flips to COIN_FLIP while
// already being watched.
export function useCoinFlipReveal(matchups: BracketStateMatchup[], dismissAfterMs: number): BracketStateMatchup | null {
  const [seenIds, setSeenIds] = useState<Set<string> | null>(null);
  const [announced, setAnnounced] = useState<BracketStateMatchup | null>(null);

  const coinFlipIds = new Set(matchups.filter((m) => m.resolutionMethod === "COIN_FLIP").map((m) => m.id));
  if (seenIds === null) {
    setSeenIds(coinFlipIds);
  } else {
    const newest = matchups.find((m) => m.resolutionMethod === "COIN_FLIP" && !seenIds.has(m.id));
    if (newest) {
      setSeenIds(coinFlipIds);
      setAnnounced(newest);
    }
  }

  useEffect(() => {
    if (!announced) return;
    const timer = setTimeout(() => setAnnounced(null), dismissAfterMs);
    return () => clearTimeout(timer);
  }, [announced, dismissAfterMs]);

  return announced;
}
