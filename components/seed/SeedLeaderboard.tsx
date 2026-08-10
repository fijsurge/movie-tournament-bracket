import Image from "next/image";
import type { BracketStateMovie } from "@/types/bracket";

export function SeedLeaderboard({ movies, voterCount }: { movies: BracketStateMovie[]; voterCount: number }) {
  const sorted = [...movies].sort((a, b) => (b.seedVoteAverage ?? 0) - (a.seedVoteAverage ?? 0));

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h2 className="text-center font-display text-2xl tracking-wide text-gold uppercase">Seeding in progress…</h2>
      <ul className="mx-auto flex w-full max-w-xl flex-col gap-2">
        {sorted.map((m, i) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.75)]"
          >
            <span className="w-6 text-right font-display text-gold">{i + 1}</span>
            {m.posterUrl ? (
              <Image
                src={m.posterUrl}
                alt=""
                width={44}
                height={66}
                className="rounded shadow-[0_4px_10px_-4px_rgba(0,0,0,0.7)]"
              />
            ) : (
              <div className="h-[66px] w-11 shrink-0 rounded bg-surface-raised" />
            )}
            <span className="flex-1 truncate">{m.title}</span>
            <span className="text-sm text-gold">
              {m.seedVoteAverage !== null ? m.seedVoteAverage.toFixed(1) : "—"}{" "}
              <span className="text-cream-dim">({m.seedVoteCount}/{voterCount})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
