"use client";

import { useEffect, useState } from "react";

// Detects the newest item added to a list (by id) and returns it for a
// window before clearing. State is adjusted during render rather than in an
// effect (react.dev's documented pattern for deriving state from props) —
// avoids an extra render pass and the "no setState in effect" lint rule.
export function useNewestPick<T extends { id: string }>(items: T[], dismissAfterMs: number): T | null {
  const [seenIds, setSeenIds] = useState<Set<string> | null>(null);
  const [announced, setAnnounced] = useState<T | null>(null);

  const currentIds = new Set(items.map((item) => item.id));
  if (seenIds === null) {
    setSeenIds(currentIds);
  } else {
    const newest = items.find((item) => !seenIds.has(item.id));
    if (newest) {
      setSeenIds(currentIds);
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
