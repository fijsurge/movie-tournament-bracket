"use client";

import { AnimatePresence, motion } from "motion/react";
import { useNewestPick } from "@/hooks/useNewestPick";

interface AnnouncedMovie {
  id: string;
}

// Brief "look at the TV" cue on the phone when a new pick lands — the full
// reveal (poster, title, who picked it) plays on the TV via
// PickRevealOverlay, so this stays deliberately minimal.
export function PickAnnouncement({ movies }: { movies: AnnouncedMovie[] }) {
  const announced = useNewestPick(movies, 2400);

  return (
    <AnimatePresence>
      {announced && (
        <motion.p
          key={announced.id}
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="rounded-lg border border-gold bg-gold/10 p-3 text-center font-display text-sm tracking-wide text-gold uppercase shadow-[0_0_30px_-8px_rgba(232,163,61,0.5)]"
        >
          👀 The pick is in — check the TV!
        </motion.p>
      )}
    </AnimatePresence>
  );
}
