import Image from "next/image";
import type { BracketStateMovie } from "@/types/bracket";

export function SeedLeaderboard({ movies, voterCount }: { movies: BracketStateMovie[]; voterCount: number }) {
  const sorted = [...movies].sort((a, b) => (b.seedVoteAverage ?? 0) - (a.seedVoteAverage ?? 0));

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h2 className="text-center font-display text-2xl tracking-wide text-gold uppercase">Seeding in progress…</h2>
      <ul className="mx-auto flex w-full max-w-xl flex-col gap-2">
        {sorted.map((m, i) => (
          <li key={m.id} className="flex items-center gap-3 rounded-lg border border-gold/15 bg-surface px-3 py-2">
            <span className="w-6 text-right text-cream-dim">{i + 1}</span>
            {m.posterUrl && <Image src={m.posterUrl} alt="" width={32} height={48} className="rounded" />}
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
