import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { BracketState } from "@/types/bracket";
import { Avatar } from "@/components/shared/Avatar";

export function NominationPool({ state }: { state: BracketState }) {
  const { bracket, movies, draft } = state;

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <AnimatePresence mode="wait">
        {bracket.nominationMode === "DRAFT" && draft && (
          <motion.p
            key={draft.currentVoterId ?? "done"}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="text-center font-display text-2xl tracking-wide uppercase"
          >
            {draft.currentVoterName ? (
              <>
                On the clock: <span className="text-gold">{draft.currentVoterName}</span>
              </>
            ) : (
              "Draft complete!"
            )}
          </motion.p>
        )}
      </AnimatePresence>
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
        <AnimatePresence initial={false}>
          {movies.map((m) => (
            <motion.li
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.75)]"
            >
              {m.posterUrl ? (
                <Image
                  src={m.posterUrl}
                  alt=""
                  width={42}
                  height={63}
                  className="rounded shadow-[0_4px_10px_-4px_rgba(0,0,0,0.7)]"
                />
              ) : (
                <div className="h-[63px] w-[42px] shrink-0 rounded bg-surface-raised" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm">{m.title}</p>
                {m.nominatedByName && (
                  <p className="flex items-center gap-1 truncate text-xs text-cream-dim">
                    <Avatar name={m.nominatedByName} avatar={m.nominatedByAvatar} size="sm" />
                    {m.nominatedByName}
                  </p>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
