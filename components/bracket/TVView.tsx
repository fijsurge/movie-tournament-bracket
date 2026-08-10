"use client";

import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { NominationPool } from "@/components/nominate/NominationPool";
import { SeedLeaderboard } from "@/components/seed/SeedLeaderboard";
import { BracketTree } from "@/components/bracket/BracketTree";
import { ChampionBanner } from "@/components/bracket/ChampionBanner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TVView({ slug }: { slug: string }) {
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });

  if (!data) {
    return <p className="flex flex-1 items-center justify-center text-2xl text-neutral-500">Loading…</p>;
  }

  const { bracket, rounds, voterNames } = data;

  if (bracket.status === "SETUP") {
    return (
      <p className="flex flex-1 items-center justify-center text-2xl text-neutral-400">
        Waiting for the host to open nominations…
      </p>
    );
  }

  if (bracket.status === "NOMINATING") {
    return <NominationPool state={data} />;
  }

  if (bracket.status === "SEEDING") {
    return <SeedLeaderboard movies={data.movies} voterCount={voterNames.length} />;
  }

  if (bracket.status === "COMPLETE") {
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
      />
    );
  }

  return <BracketTree rounds={rounds} />;
}
