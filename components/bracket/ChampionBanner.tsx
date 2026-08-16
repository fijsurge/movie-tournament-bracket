"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { TrailerEmbed, TRAILER_TV_SKIP_SECONDS } from "@/components/shared/TrailerEmbed";
import { playWinnerFanfare, playApplause } from "@/lib/sfx";

// Safety net in case the YouTube IFrame API's ENDED event never fires (ad
// blocker, flaky script load) — the TV can't get stuck on a finished video
// forever without ever revealing the champion.
const REVEAL_FALLBACK_MS = 3 * 60 * 1000;

export function ChampionBanner({
  bracketName,
  championTitle,
  posterUrl,
  trailerKey,
  soundEnabled,
}: {
  bracketName: string;
  championTitle: string;
  posterUrl: string | null;
  trailerKey?: string | null;
  soundEnabled: boolean;
}) {
  // Suspense: with a trailer, play it first (poster/title withheld) and
  // only reveal the champion once it ends or is skipped — without one,
  // there's nothing to build suspense with, so go straight to the reveal.
  const [phase, setPhase] = useState<"trailer" | "reveal">(trailerKey ? "trailer" : "reveal");

  function reveal() {
    setPhase("reveal");
  }

  useEffect(() => {
    if (phase !== "trailer") return;
    const timer = setTimeout(reveal, REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Fires once per transition into the reveal phase — on mount for the
  // no-trailer case, or once the trailer phase hands off via onEnded/Skip.
  useEffect(() => {
    if (phase === "reveal" && soundEnabled) {
      playWinnerFanfare();
      playApplause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-8 text-center">
      <AnimatePresence mode="wait">
        {phase === "trailer" && trailerKey ? (
          <motion.div
            key="trailer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex w-full flex-col items-center gap-4"
          >
            <p className="font-display text-xl tracking-wide text-cream-dim uppercase">
              {bracketName} — revealing the champion…
            </p>
            <div className="w-full max-w-5xl">
              <TrailerEmbed
                trailerKey={trailerKey}
                startMuted={!soundEnabled}
                startSeconds={TRAILER_TV_SKIP_SECONDS}
                onEnded={reveal}
              />
            </div>
            <button
              type="button"
              onClick={reveal}
              className="rounded-full border border-gold/40 px-4 py-2 text-sm text-cream transition hover:border-gold active:scale-95"
            >
              Skip ▶
            </button>
          </motion.div>
        ) : (
          <motion.div key="reveal" className="flex flex-col items-center gap-6">
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="font-display text-2xl tracking-wide text-cream-dim uppercase"
            >
              {bracketName}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 14 }}
              className="text-4xl"
            >
              🏆
            </motion.p>
            {posterUrl && (
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1.6 }}
                  transition={{ delay: 0.5, duration: 1.1, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gold/30 blur-3xl"
                  aria-hidden="true"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 18 }}
                >
                  <Image
                    src={posterUrl}
                    alt=""
                    width={220}
                    height={330}
                    className="rounded-lg shadow-[0_0_60px_-10px_rgba(232,163,61,0.5)]"
                  />
                </motion.div>
              </div>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="font-display text-5xl tracking-wide text-gold uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.4)]"
            >
              {championTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="text-xl text-rose"
            >
              Champion!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
