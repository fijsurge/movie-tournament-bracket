"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { NominationPool } from "@/components/nominate/NominationPool";
import { SeedLeaderboard } from "@/components/seed/SeedLeaderboard";
import { ZoomableBracketTree } from "@/components/bracket/ZoomableBracketTree";
import { ScoreLeaderboard } from "@/components/bracket/ScoreLeaderboard";
import { ChampionBanner } from "@/components/bracket/ChampionBanner";
import { PickRevealOverlay } from "@/components/bracket/PickRevealOverlay";
import { RoundTransitionOverlay } from "@/components/bracket/RoundTransitionOverlay";
import { CoinFlipOverlay } from "@/components/bracket/CoinFlipOverlay";
import { unlockAudio } from "@/lib/sfx";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const SOUND_STORAGE_KEY = "tv-sound-enabled";

type CompleteView = "reveal" | "bracket";

export function TVView({ slug }: { slug: string }) {
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 10000,
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

  // Once a bracket is COMPLETE, TV always used to show only the champion
  // reveal — there was no way to go back and see the full bracket on the
  // big screen afterward. Defaults to the reveal (the actual "moment"),
  // with a toggle to switch over, mirroring the same Winner/Full bracket
  // choice already offered on the voter's own completed-bracket page.
  const [completeView, setCompleteView] = useState<CompleteView>("reveal");

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
      {bracket.status === "COMPLETE" && (
        // Deliberately not `fixed` — the page's own header (rendered by
        // the parent, app/b/[slug]/tv/page.tsx) isn't pinned either, and a
        // fixed-position toggle here just sat at a hardcoded viewport
        // offset that overlapped the header's title regardless of its
        // actual height. As a normal flex-col sibling it always lands
        // right below the header, however tall it ends up being.
        <div className="flex shrink-0 justify-center py-3">
          <div className="flex gap-2 rounded-full border border-gold/40 bg-surface p-1">
            {(
              [
                { key: "reveal", label: "🏆 Reveal" },
                { key: "bracket", label: "🗂️ Full bracket" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCompleteView(tab.key)}
                aria-pressed={completeView === tab.key}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
                  completeView === tab.key ? "bg-gold text-ink" : "text-cream-dim hover:text-cream"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <PickRevealOverlay movies={movies} soundEnabled={soundEnabled} />
      <RoundTransitionOverlay rounds={rounds} soundEnabled={soundEnabled} />
      <CoinFlipOverlay rounds={rounds} soundEnabled={soundEnabled} />
      {bracket.status === "SETUP" && (
        <p className="flex flex-1 items-center justify-center text-2xl text-cream-dim">
          Waiting for the host to open nominations…
        </p>
      )}
      {bracket.status === "NOMINATING" && <NominationPool state={data} />}
      {bracket.status === "SEEDING" && <SeedLeaderboard movies={movies} voterCount={voterNames.length} />}
      {bracket.status === "COMPLETE" &&
        completeView === "reveal" &&
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
      {((bracket.status === "COMPLETE" && completeView === "bracket") || bracket.status === "ACTIVE") && (
        <div className="flex flex-1 items-start gap-4">
          <ZoomableBracketTree rounds={rounds} floatingControls />
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
