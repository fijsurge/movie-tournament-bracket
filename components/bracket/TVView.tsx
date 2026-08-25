"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { NominationPool } from "@/components/nominate/NominationPool";
import { SeedLeaderboard } from "@/components/seed/SeedLeaderboard";
import { BracketTree } from "@/components/bracket/BracketTree";
import { ScoreLeaderboard } from "@/components/bracket/ScoreLeaderboard";
import { ChampionBanner } from "@/components/bracket/ChampionBanner";
import { PickRevealOverlay } from "@/components/bracket/PickRevealOverlay";
import { RoundTransitionOverlay } from "@/components/bracket/RoundTransitionOverlay";
import { unlockAudio } from "@/lib/sfx";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const SOUND_STORAGE_KEY = "tv-sound-enabled";
const ZOOM_STORAGE_KEY = "tv-zoom-level";
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export function TVView({ slug }: { slug: string }) {
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });

  // Starts false and syncs from localStorage in an effect (not read
  // directly during render) to avoid an SSR/hydration mismatch — the
  // server has no localStorage to read from. The one-time post-mount
  // correction is intentional here, not a synchronization smell.
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoundEnabled(localStorage.getItem(SOUND_STORAGE_KEY) === "1");
    const storedZoom = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
    if (storedZoom >= MIN_ZOOM && storedZoom <= MAX_ZOOM) {
      setZoomLevel(storedZoom);
    }
  }, []);

  function adjustZoom(delta: number) {
    setZoomLevel((prev) => {
      const next = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)) * 100) / 100;
      localStorage.setItem(ZOOM_STORAGE_KEY, String(next));
      return next;
    });
  }

  function toggleSound() {
    // Trailer/SFX autoplay-with-sound only has a real chance of working if
    // the browser sees this as the user gesture that unlocked it — calling
    // unlockAudio() synchronously inside the click handler, not later, is
    // what makes that work for the AudioContext-based chimes.
    unlockAudio();
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  if (!data) {
    return <p className="flex flex-1 items-center justify-center text-2xl text-cream-dim">Loading…</p>;
  }

  const { bracket, rounds, voterNames, movies, leaderboard } = data;

  return (
    <>
      <button
        type="button"
        onClick={toggleSound}
        className="fixed bottom-4 left-4 z-40 rounded-full border border-gold/40 bg-ink/80 px-3 py-1.5 text-sm text-cream backdrop-blur transition hover:border-gold active:scale-95"
      >
        {soundEnabled ? "🔊 Sound on" : "🔈 Tap for sound"}
      </button>
      {bracket.status === "ACTIVE" && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full border border-gold/40 bg-ink/80 px-1.5 py-1 text-sm text-cream backdrop-blur">
          <button
            type="button"
            onClick={() => adjustZoom(-ZOOM_STEP)}
            disabled={zoomLevel <= MIN_ZOOM}
            aria-label="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:text-gold active:scale-90 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-10 text-center text-xs text-cream-dim">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            onClick={() => adjustZoom(ZOOM_STEP)}
            disabled={zoomLevel >= MAX_ZOOM}
            aria-label="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:text-gold active:scale-90 disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}
      <PickRevealOverlay movies={movies} soundEnabled={soundEnabled} />
      <RoundTransitionOverlay rounds={rounds} soundEnabled={soundEnabled} />
      {bracket.status === "SETUP" && (
        <p className="flex flex-1 items-center justify-center text-2xl text-cream-dim">
          Waiting for the host to open nominations…
        </p>
      )}
      {bracket.status === "NOMINATING" && <NominationPool state={data} />}
      {bracket.status === "SEEDING" && <SeedLeaderboard movies={movies} voterCount={voterNames.length} />}
      {bracket.status === "COMPLETE" &&
        (() => {
          const finalMatchup = rounds.at(-1)?.matchups[0];
          return (
            <ChampionBanner
              bracketName={bracket.name}
              championTitle={finalMatchup?.winnerTitle ?? "?"}
              posterUrl={
                (finalMatchup?.movieA?.id === finalMatchup?.winnerMovieId
                  ? finalMatchup?.movieA?.posterUrl
                  : finalMatchup?.movieB?.posterUrl) ?? null
              }
              trailerKey={
                (finalMatchup?.movieA?.id === finalMatchup?.winnerMovieId
                  ? finalMatchup?.movieA?.trailerKey
                  : finalMatchup?.movieB?.trailerKey) ?? null
              }
              soundEnabled={soundEnabled}
              leaderboard={leaderboard}
            />
          );
        })()}
      {bracket.status === "ACTIVE" && (
        // No overflow-hidden here — the TV page's own wrapper
        // (app/b/[slug]/tv/page.tsx) already scrolls; clipping here just
        // hid large brackets instead of letting that scroll do its job.
        // `zoom` (not `transform: scale`) so zooming out actually shrinks
        // the scrollable area too, not just the visual size.
        <div className="flex flex-1 items-start gap-4" style={{ zoom: zoomLevel }}>
          <BracketTree rounds={rounds} />
          {leaderboard && (
            <div className="w-64 shrink-0 py-6 pr-6">
              <ScoreLeaderboard entries={leaderboard} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
