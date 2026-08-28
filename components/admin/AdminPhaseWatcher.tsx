"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { BracketState } from "@/types/bracket";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// The admin's bracket page is a plain server component with no live-refresh
// of its own — unlike voters (see PhaseWatcher), the admin got nothing:
// a new tie appearing, a round completing, anything at all required a
// manual reload. Simpler than PhaseWatcher since there's no full-screen
// takeover concept for the admin's own working view — any detected change
// just quietly refreshes the page.
export function AdminPhaseWatcher({ slug }: { slug: string }) {
  const router = useRouter();
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 10000,
  });
  // Ref, not state — the effect's own dependency array (keyed on
  // `fingerprint`'s value) is what detects a change; this only needs to
  // remember "have we recorded a baseline yet," which shouldn't itself
  // trigger a re-render.
  const hasBaseline = useRef(false);

  // forceCategoryVoting has to be in here alongside status — an auto-reopen
  // after a first tie leaves status at "OPEN" (it was already open), so
  // this fingerprint would otherwise miss that transition entirely. See the
  // matching comment on PhaseWatcher's own fingerprint.
  const fingerprint = data
    ? [
        data.bracket.status,
        data.rounds
          .map(
            (r) =>
              `${r.roundNumber}:${r.status}:${r.matchups.map((m) => `${m.id}:${m.status}:${m.forceCategoryVoting}`).join(";")}`,
          )
          .join(","),
      ].join("|")
    : "";

  useEffect(() => {
    if (!fingerprint) return;
    if (!hasBaseline.current) {
      hasBaseline.current = true;
      return;
    }
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  return null;
}
