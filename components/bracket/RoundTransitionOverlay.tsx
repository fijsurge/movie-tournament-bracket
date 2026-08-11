"use client";

import { motion } from "motion/react";
import { TVTakeoverShell } from "@/components/bracket/TVTakeoverShell";
import { useRoundTransition } from "@/hooks/useRoundTransition";
import type { BracketStateRound } from "@/types/bracket";

// Full-screen TV takeover when voting advances to a new round — only ever
// receives new data while the bracket is ACTIVE, so it never collides with
// PickRevealOverlay (NOMINATING-only).
export function RoundTransitionOverlay({ rounds }: { rounds: BracketStateRound[] }) {
  const currentRound = rounds.find((r) => r.status === "VOTING_OPEN")?.roundNumber ?? null;
  const announced = useRoundTransition(currentRound, 3500);
  const isFinal = announced !== null && announced === rounds.length;

  return (
    <TVTakeoverShell active={announced !== null}>
      {announced !== null && (
        <>
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display text-xl tracking-wide text-cream-dim uppercase"
          >
            The field narrows…
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 16 }}
            className="font-display text-6xl tracking-wide text-gold uppercase drop-shadow-[0_0_40px_rgba(232,163,61,0.4)]"
          >
            {isFinal ? "The Final" : `Round ${announced}`}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-xl text-rose"
          >
            {isFinal ? "One matchup left." : "Voting is open — cast your picks!"}
          </motion.p>
        </>
      )}
    </TVTakeoverShell>
  );
}
