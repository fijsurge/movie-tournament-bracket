"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCoinFlipReveal } from "@/hooks/useCoinFlipReveal";
import type { BracketStateMatchup } from "@/types/bracket";

// Quieter, non-takeover version of CoinFlipOverlay for the voter's own
// page — no sound (this page has no such concept), just an inline card
// announcing the result, since voters can land here anytime and don't
// need a suspense sequence, only the outcome.
export function CoinFlipBanner({ matchups }: { matchups: BracketStateMatchup[] }) {
  const announced = useCoinFlipReveal(matchups, 8000);
  const winner = announced
    ? announced.winnerMovieId === announced.movieA?.id
      ? announced.movieA
      : announced.movieB
    : null;

  return (
    <AnimatePresence>
      {announced && winner && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-surface p-3">
            <span className="text-3xl" aria-hidden="true">
              🪙
            </span>
            {winner.posterUrl && (
              <Image src={winner.posterUrl} alt="" width={40} height={60} className="shrink-0 rounded" />
            )}
            <p className="text-sm">
              <span className="font-medium text-gold">{announced.movieA?.title}</span> vs{" "}
              <span className="font-medium text-gold">{announced.movieB?.title}</span> tied — a coin flip picked{" "}
              <span className="font-medium text-gold">{winner.title}</span>!
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
