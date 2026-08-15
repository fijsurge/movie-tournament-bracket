"use client";

import { useState } from "react";

// Trailers open with a bumper/studio logo more often than not, and TMDb
// gives no per-video timestamp for "where the real content starts" — this
// is a fixed heuristic, not a guarantee of landing near the title card.
// Shared by the two shared-TV callers (PickRevealOverlay, ChampionBanner);
// not used for on-demand voter-initiated playback (MovieInfoSheet), which
// plays the whole trailer from 0:00 as expected.
export const TRAILER_TV_SKIP_SECONDS = 5;

// Browser autoplay-with-sound policies are unreliable, so this always starts
// muted with a visible unmute affordance rather than betting on unmuted
// autoplay working. Unmuting remounts the iframe with a fresh `mute=0` URL —
// simplest approach; the trailer restarts from 0:00, which is an acceptable
// tradeoff here over the added complexity of the YouTube postMessage API.
export function TrailerEmbed({
  trailerKey,
  startMuted = true,
  startSeconds = 0,
  className,
}: {
  trailerKey: string;
  startMuted?: boolean;
  startSeconds?: number;
  className?: string;
}) {
  const [muted, setMuted] = useState(startMuted);
  const src = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&modestbranding=1&rel=0&playlist=${trailerKey}&loop=1&start=${startSeconds}`;

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg ${className ?? ""}`}>
      <iframe
        key={muted ? "muted" : "unmuted"}
        src={src}
        title="Trailer"
        allow="autoplay; encrypted-media"
        className="h-full w-full"
      />
      {muted && (
        <button
          type="button"
          onClick={() => setMuted(false)}
          className="absolute right-2 bottom-2 rounded-full bg-ink/80 px-3 py-1 text-xs text-cream backdrop-blur transition hover:bg-ink active:scale-95"
        >
          🔊 Unmute
        </button>
      )}
    </div>
  );
}
