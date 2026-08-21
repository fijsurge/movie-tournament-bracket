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

export function TVView({ slug }: { slug: string }) {
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });

  // Starts false and syncs from localStorage in an effect (not read
  // directly during render) to avoid an SSR/hydration mismatch — the
  // server has no localStorage to read from. The one-time post-mount
  // correction is intentional here, not a synchronization smell.
  const [soundEnabled, setSoundEnabled] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoundEnabled(localStorage.getItem(SOUND_STORAGE_KEY) === "1");
  }, []);

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
        <div className="flex flex-1 items-start gap-4 overflow-hidden">
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
