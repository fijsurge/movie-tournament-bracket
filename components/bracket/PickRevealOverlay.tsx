"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Avatar } from "@/components/shared/Avatar";
import { TVTakeoverShell } from "@/components/bracket/TVTakeoverShell";
import { TrailerEmbed, TRAILER_TV_SKIP_SECONDS } from "@/components/shared/TrailerEmbed";
import { useNewestPick } from "@/hooks/useNewestPick";
import { playPickChime } from "@/lib/sfx";

interface AnnouncedMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  trailerKey: string | null;
  nominatedByName: string | null;
  nominatedByAvatar: string | null;
}

// Full-screen TV takeover for a new pick landing during nomination/draft —
// only ever receives new data while the bracket is NOMINATING, so it never
// collides with RoundTransitionOverlay (ACTIVE-only). Holds longer when a
// trailer is available, playing it as ambient background motion — not meant
// to be actively watched, just adds life. A later pick landing before the
// window elapses cuts it short as normal (useNewestPick's existing
// supersede-the-current-item behavior). The 16s window (vs. 4s with no
// trailer) gives room to get past TRAILER_TV_SKIP_SECONDS into real content.
export function PickRevealOverlay({
  movies,
  soundEnabled,
}: {
  movies: AnnouncedMovie[];
  soundEnabled: boolean;
}) {
  const announced = useNewestPick(movies, (m) => (m.trailerKey ? 16000 : 4000));

  useEffect(() => {
    if (announced && soundEnabled) playPickChime();
    // Only the identity of the newly-announced pick should re-trigger the
    // chime — not every soundEnabled toggle while one's already showing.
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
            className="font-display text-2xl tracking-wide text-gold uppercase"
          >
            🎬 The pick is in!
          </motion.p>
          {announced.posterUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 18 }}
            >
              <Image
                src={announced.posterUrl}
                alt=""
                width={220}
                height={330}
                className="rounded-lg shadow-[0_0_60px_-10px_rgba(232,163,61,0.5)]"
              />
            </motion.div>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="font-display text-4xl tracking-wide text-cream uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.3)]"
          >
            {announced.title}
          </motion.h1>
          {announced.nominatedByName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center gap-2 text-xl text-rose"
            >
              <Avatar name={announced.nominatedByName} avatar={announced.nominatedByAvatar} size="sm" />
              picked by {announced.nominatedByName}
            </motion.div>
          )}
          {announced.trailerKey && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="w-full max-w-md"
            >
              <TrailerEmbed
                trailerKey={announced.trailerKey}
                startMuted={!soundEnabled}
                startSeconds={TRAILER_TV_SKIP_SECONDS}
              />
            </motion.div>
          )}
        </>
      )}
    </TVTakeoverShell>
  );
}
