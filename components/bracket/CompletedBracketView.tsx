"use client";

import { useState } from "react";
import Image from "next/image";
import { BracketTree } from "@/components/bracket/BracketTree";
import { ScoreLeaderboard } from "@/components/bracket/ScoreLeaderboard";
import type { BracketStateRound, BracketStateLeaderboardEntry } from "@/types/bracket";

type View = "winner" | "bracket";

// Voters revisit this page anytime after a bracket completes, not just in
// the reveal moment — so unlike ChampionBanner (the TV's one-time trailer
// + fanfare reveal sequence), this is a static poster display with no
// sound or suspense, just the result. A toggle instead of stacking both
// views, since the poster art and the round-by-round tree were competing
// for the same page and the poster was getting lost underneath the tree.
export function CompletedBracketView({
  championTitle,
  posterUrl,
  poolWinners,
  rounds,
  leaderboard,
}: {
  championTitle: string;
  posterUrl: string | null;
  poolWinners: { voterName: string; points: number }[];
  rounds: BracketStateRound[];
  leaderboard: BracketStateLeaderboardEntry[];
}) {
  const [view, setView] = useState<View>("winner");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 rounded-full border border-gold/20 bg-surface p-1">
        {(
          [
            { key: "winner", label: "🏆 Winner" },
            { key: "bracket", label: "🗂️ Full bracket" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            aria-pressed={view === tab.key}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
              view === tab.key ? "bg-gold text-ink" : "text-cream-dim hover:text-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "winner" ? (
        <div className="flex w-full flex-col items-center gap-4 py-4 text-center">
          {posterUrl && (
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gold/30 blur-3xl"
                aria-hidden="true"
              />
              <Image
                src={posterUrl}
                alt=""
                width={220}
                height={330}
                className="rounded-lg shadow-[0_0_60px_-10px_rgba(232,163,61,0.5)]"
              />
            </div>
          )}
          <h2 className="font-display text-3xl tracking-wide text-gold uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.4)]">
            {championTitle}
          </h2>
          {poolWinners.length > 0 && (
            <p className="text-lg text-cream">
              🎯{" "}
              <span className="font-medium text-gold">{poolWinners.map((w) => w.voterName).join(" & ")}</span>{" "}
              {poolWinners.length > 1 ? "tie for" : "wins"} the pool with {poolWinners[0].points} points!
            </p>
          )}
          {leaderboard.length > 0 && (
            <div className="w-full max-w-sm px-6 pt-2">
              <ScoreLeaderboard entries={leaderboard} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="text-lg">
            🏆 Champion: <span className="font-semibold text-gold">{championTitle}</span>
          </p>
          <BracketTree rounds={rounds} />
        </div>
      )}
    </div>
  );
}
