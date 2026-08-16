"use client";

import { useEffect, useId, useRef, useState } from "react";

// Trailers open with a bumper/studio logo more often than not, and TMDb
// gives no per-video timestamp for "where the real content starts" — this
// is a fixed heuristic, not a guarantee of landing near the title card.
// Shared by the two shared-TV callers (PickRevealOverlay, ChampionBanner);
// not used for on-demand voter-initiated playback (MovieInfoSheet), which
// plays the whole trailer from 0:00 as expected.
export const TRAILER_TV_SKIP_SECONDS = 5;

// --- YouTube IFrame Player API — only loaded/used when a caller needs to
// know when playback ends (see `onEnded` below). A plain `<iframe src=...>`
// has no way to signal that, so this is the only reliable option. Minimal
// local types for just the surface used here, rather than pulling in
// `@types/youtube` for three method signatures.
interface YTPlayer {
  mute(): void;
  unMute(): void;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

// Browser autoplay-with-sound policies are unreliable, so this always starts
// muted with a visible unmute affordance rather than betting on unmuted
// autoplay working.
export function TrailerEmbed({
  trailerKey,
  startMuted = true,
  startSeconds = 0,
  onEnded,
  className,
}: {
  trailerKey: string;
  startMuted?: boolean;
  startSeconds?: number;
  // Only needed for "reveal something once the trailer finishes" flows
  // (the champion banner's suspense reveal) — switches this instance to
  // the YouTube IFrame Player API so playback state is actually knowable.
  // Callers that don't need this keep the plain, simpler iframe path.
  onEnded?: () => void;
  className?: string;
}) {
  const [muted, setMuted] = useState(startMuted);
  const hostId = useId();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    if (!onEnded) return;
    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      const player = new window.YT.Player(hostId, {
        videoId: trailerKey,
        playerVars: {
          autoplay: 1,
          mute: startMuted ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          start: startSeconds,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT!.PlayerState.ENDED) onEnded();
          },
        },
      });
      playerRef.current = player;
      iframeRef.current = player.getIframe();
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // trailerKey/startSeconds/onEnded intentionally not re-run on change —
    // this player is constructed once per mount, matching how the plain
    // iframe path below only remounts on a genuine key change via `key=`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId]);

  function handleUnmute() {
    setMuted(false);
    playerRef.current?.unMute();
  }

  function handleFullscreen() {
    iframeRef.current?.requestFullscreen();
  }

  const src = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&modestbranding=1&rel=0&start=${startSeconds}`;

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg ${className ?? ""}`}>
      {onEnded ? (
        <div id={hostId} className="h-full w-full" />
      ) : (
        <iframe
          ref={iframeRef}
          key={muted ? "muted" : "unmuted"}
          src={src}
          title="Trailer"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      )}
      <div className="absolute right-2 bottom-2 flex gap-2">
        {muted && (
          <button
            type="button"
            onClick={handleUnmute}
            className="rounded-full bg-ink/80 px-3 py-1 text-xs text-cream backdrop-blur transition hover:bg-ink active:scale-95"
          >
            🔊 Unmute
          </button>
        )}
        <button
          type="button"
          onClick={handleFullscreen}
          className="rounded-full bg-ink/80 px-3 py-1 text-xs text-cream backdrop-blur transition hover:bg-ink active:scale-95"
        >
          ⛶ Fullscreen
        </button>
      </div>
    </div>
  );
}
