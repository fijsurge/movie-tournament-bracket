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
//
// Poster/title/attribution are condensed into one compact row (rather than
// three separately-staggered, large elements) so the trailer — the thing
// actually worth watching here — gets more room and appears sooner, without
// hiding who picked what (unlike the champion reveal's suspense, there's
// nothing to build suspense around in a mid-draft pick).
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            {announced.posterUrl && (
              <Image
                src={announced.posterUrl}
                alt=""
                width={70}
                height={105}
                className="rounded-md shadow-[0_0_30px_-8px_rgba(232,163,61,0.4)]"
              />
            )}
            <div className="flex flex-col items-start gap-1 text-left">
              <h1 className="font-display text-2xl tracking-wide text-cream uppercase drop-shadow-[0_0_20px_rgba(232,163,61,0.3)]">
                {announced.title}
              </h1>
              {announced.nominatedByName && (
                <div className="flex items-center gap-2 text-base text-rose">
                  <Avatar name={announced.nominatedByName} avatar={announced.nominatedByAvatar} size="sm" />
                  picked by {announced.nominatedByName}
                </div>
              )}
            </div>
          </motion.div>
          {announced.trailerKey && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="w-full max-w-2xl"
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
