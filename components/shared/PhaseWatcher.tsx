"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { phaseHref, phaseTransitionCopy, type BracketPhaseStatus } from "@/lib/phase-nav";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Transition {
  href: string;
  headline: string;
  subline: string;
}

// Invisible poller that watches for the bracket's phase (or, during ACTIVE
// voting, the current round) changing underneath a voter who's just sitting
// on the page — without this, a phase advance only used to show up after the
// voter manually navigated away and back, landing on a dead-end "not open
// right now" message. When it detects a change it plays a brief full-screen
// takeover, then navigates to wherever that phase actually lives.
export function PhaseWatcher({
  slug,
  status,
  currentRound = null,
}: {
  slug: string;
  status: BracketPhaseStatus;
  currentRound?: number | null;
}) {
  const router = useRouter();
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });
  const [transition, setTransition] = useState<Transition | null>(null);

  const liveRound = data ? (data.rounds.find((r) => r.status === "VOTING_OPEN")?.roundNumber ?? null) : null;
  const statusChanged = data !== undefined && data.bracket.status !== status;
  const roundChanged = !statusChanged && status === "ACTIVE" && liveRound !== null && liveRound !== currentRound;

  if (data && (statusChanged || roundChanged) && !transition) {
    const dest = phaseHref({ slug, status: data.bracket.status, nominationMode: data.bracket.nominationMode });
    const copy = phaseTransitionCopy(data.bracket.status, roundChanged ? liveRound : null);
    setTransition({ href: dest ?? `/b/${slug}`, ...copy });
  }

  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(() => router.push(transition.href), 1800);
    return () => clearTimeout(timer);
  }, [transition, router]);

  return (
    <AnimatePresence>
      {transition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 overflow-hidden bg-ink p-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1.8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute h-[480px] w-[480px] rounded-full bg-gold/25 blur-3xl"
            aria-hidden="true"
          />
          <motion.p
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
            className="font-display text-3xl tracking-wide text-gold uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.4)]"
          >
            {transition.headline}
          </motion.p>
          {transition.subline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-rose"
            >
              {transition.subline}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
