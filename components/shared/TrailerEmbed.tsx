"use client";

import { useState } from "react";

// Browser autoplay-with-sound policies are unreliable, so this always starts
// muted with a visible unmute affordance rather than betting on unmuted
// autoplay working. Unmuting remounts the iframe with a fresh `mute=0` URL —
// simplest approach; the trailer restarts from 0:00, which is an acceptable
// tradeoff here over the added complexity of the YouTube postMessage API.
export function TrailerEmbed({
  trailerKey,
  startMuted = true,
  className,
}: {
  trailerKey: string;
  startMuted?: boolean;
  className?: string;
}) {
  const [muted, setMuted] = useState(startMuted);
  const src = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&modestbranding=1&rel=0&playlist=${trailerKey}&loop=1`;

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
          className="absolute right-2 bottom-2 rounded-full bg-ink/80 px-3 py-1 text-xs text-cream backdrop-blur transition hover:bg-ink"
        >
          🔊 Unmute
        </button>
      )}
    </div>
  );
}
