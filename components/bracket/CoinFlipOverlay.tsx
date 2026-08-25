"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { TVTakeoverShell } from "@/components/bracket/TVTakeoverShell";
import { useCoinFlipReveal } from "@/hooks/useCoinFlipReveal";
import { playCoinFlip } from "@/lib/sfx";
import type { BracketStateRound } from "@/types/bracket";

// Full-screen TV takeover when a tie gets decided by a coin flip — the one
// moment in the tiebreak-escalation ladder worth making a big deal of (the
// auto-reopened "rate it again" step is deliberately quiet, just a normal
// matchup reappearing to vote on).
export function CoinFlipOverlay({ rounds, soundEnabled }: { rounds: BracketStateRound[]; soundEnabled: boolean }) {
  const matchups = rounds.flatMap((r) => r.matchups);
  const announced = useCoinFlipReveal(matchups, 5500);
  const winner = announced ? (announced.winnerMovieId === announced.movieA?.id ? announced.movieA : announced.movieB) : null;

  useEffect(() => {
    if (announced && soundEnabled) playCoinFlip();
    // Only the identity of the newly-announced flip should replay the
    // sound — not every soundEnabled toggle while one's already showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announced?.id]);

  return (
    <TVTakeoverShell active={announced !== null}>
      {announced && (
        <>
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display text-xl tracking-wide text-cream-dim uppercase"
          >
            {announced.movieA?.title} vs {announced.movieB?.title} — dead even
          </motion.p>
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotateY: 0 }}
            animate={{ scale: 1, opacity: 1, rotateY: 1800 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="text-8xl"
          >
            🪙
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="font-display text-lg tracking-wide text-rose uppercase"
          >
            A coin flip decides it…
          </motion.p>
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.7, type: "spring", stiffness: 220, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              {winner.posterUrl && (
                <Image
                  src={winner.posterUrl}
                  alt=""
                  width={110}
                  height={165}
                  className="rounded-md shadow-[0_0_30px_-8px_rgba(232,163,61,0.4)]"
                />
              )}
              <h1 className="font-display text-3xl tracking-wide text-gold uppercase drop-shadow-[0_0_20px_rgba(232,163,61,0.3)]">
                {winner.title} wins!
              </h1>
            </motion.div>
          )}
        </>
      )}
    </TVTakeoverShell>
  );
}
