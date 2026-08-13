"use client";

import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { NominationPool } from "@/components/nominate/NominationPool";
import { SeedLeaderboard } from "@/components/seed/SeedLeaderboard";
import { BracketTree } from "@/components/bracket/BracketTree";
import { ChampionBanner } from "@/components/bracket/ChampionBanner";
import { PickRevealOverlay } from "@/components/bracket/PickRevealOverlay";
import { RoundTransitionOverlay } from "@/components/bracket/RoundTransitionOverlay";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TVView({ slug }: { slug: string }) {
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });

  if (!data) {
    return <p className="flex flex-1 items-center justify-center text-2xl text-cream-dim">Loading…</p>;
  }

  const { bracket, rounds, voterNames, movies } = data;

  return (
    <>
      <PickRevealOverlay movies={movies} />
      <RoundTransitionOverlay rounds={rounds} />
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
            />
          );
        })()}
      {bracket.status === "ACTIVE" && <BracketTree rounds={rounds} />}
    </>
  );
}
