import Image from "next/image";
import type { BracketState } from "@/types/bracket";

export function NominationPool({ state }: { state: BracketState }) {
  const { bracket, movies, draft } = state;

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      {bracket.nominationMode === "DRAFT" && draft && (
        <p className="text-center font-display text-2xl tracking-wide uppercase">
          {draft.currentVoterName ? (
            <>
              On the clock: <span className="text-gold">{draft.currentVoterName}</span>
            </>
          ) : (
            "Draft complete!"
          )}
        </p>
      )}
      {bracket.nominationMode === "DRAFT" && !draft && (
        <p className="text-center font-display text-2xl tracking-wide text-cream-dim uppercase">Waiting for the draft to start…</p>
      )}
      {bracket.nominationMode === "OPEN" && (
        <p className="text-center font-display text-2xl tracking-wide text-cream-dim uppercase">Nominations are open — add your picks!</p>
      )}

      <p className="text-center text-cream-dim">
        {movies.length}
        {bracket.poolTargetSize ? ` / ${bracket.poolTargetSize}` : ""} movies
      </p>

      <ul className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {movies.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-lg border border-gold/15 bg-surface px-3 py-2">
            {m.posterUrl && <Image src={m.posterUrl} alt="" width={28} height={42} className="rounded" />}
            <div className="min-w-0">
              <p className="truncate text-sm">{m.title}</p>
              {m.nominatedByName && <p className="truncate text-xs text-cream-dim">{m.nominatedByName}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
