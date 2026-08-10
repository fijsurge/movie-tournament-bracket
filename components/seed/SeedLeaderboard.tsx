import Image from "next/image";
import type { BracketStateMovie } from "@/types/bracket";

export function SeedLeaderboard({ movies, voterCount }: { movies: BracketStateMovie[]; voterCount: number }) {
  const sorted = [...movies].sort((a, b) => (b.seedVoteAverage ?? 0) - (a.seedVoteAverage ?? 0));

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <h2 className="text-center text-2xl font-medium text-neutral-300">Seeding in progress…</h2>
      <ul className="mx-auto flex w-full max-w-xl flex-col gap-2">
        {sorted.map((m, i) => (
          <li key={m.id} className="flex items-center gap-3 rounded-lg bg-neutral-900 px-3 py-2">
            <span className="w-6 text-right text-neutral-500">{i + 1}</span>
            {m.posterUrl && <Image src={m.posterUrl} alt="" width={32} height={48} className="rounded" />}
            <span className="flex-1 truncate">{m.title}</span>
            <span className="text-sm text-neutral-400">
              {m.seedVoteAverage !== null ? m.seedVoteAverage.toFixed(1) : "—"} ({m.seedVoteCount}/{voterCount})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
