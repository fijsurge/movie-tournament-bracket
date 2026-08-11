import Image from "next/image";
import { motion } from "motion/react";
import type { BracketStateRound } from "@/types/bracket";

function SeedBadge({ seed }: { seed: number | null }) {
  if (seed === null) return null;
  return (
    <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gold bg-ink text-[10px] font-semibold text-gold">
      {seed}
    </span>
  );
}

function MatchupCard({ matchup }: { matchup: BracketStateRound["matchups"][number] }) {
  const aWon = matchup.winnerMovieId && matchup.winnerMovieId === matchup.movieA?.id;
  const bWon = matchup.winnerMovieId && matchup.winnerMovieId === matchup.movieB?.id;

  return (
    <div className="flex w-64 flex-col gap-1.5 rounded-lg border border-gold/20 bg-surface p-2.5 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.7)]">
      {[
        { movie: matchup.movieA, won: aWon },
        { movie: matchup.movieB, won: bWon },
      ].map((slot, i) => (
        <motion.div
          key={i}
          layout
          animate={slot.won ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex items-center gap-2.5 rounded border-l-2 px-2 py-1.5 ${
            slot.won ? "border-gold bg-gold/15 font-semibold text-gold" : "border-transparent text-cream-dim"
          }`}
        >
          <motion.div
            key={slot.movie?.id ?? "tbd"}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative shrink-0"
          >
            {slot.movie?.posterUrl ? (
              <Image src={slot.movie.posterUrl} alt="" width={32} height={48} className="rounded-sm" />
            ) : (
              <div className="h-12 w-8 rounded-sm bg-surface-raised" />
            )}
            <SeedBadge seed={slot.movie?.seed ?? null} />
          </motion.div>
          <span className="truncate text-sm">
            {slot.movie?.title ?? (matchup.isBye ? "— bye —" : "TBD")}
          </span>
        </motion.div>
      ))}
      {matchup.status === "NEEDS_MANUAL_TIEBREAK" && (
        <p className="text-center text-xs text-rose">Tie — admin deciding…</p>
      )}
    </div>
  );
}

function pairUp<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

export function BracketTree({ rounds }: { rounds: BracketStateRound[] }) {
  return (
    <div className="flex items-stretch overflow-x-auto p-6">
      {rounds.map((round, roundIndex) => {
        const isLastRound = roundIndex === rounds.length - 1;
        const pairs = pairUp(round.matchups);
        const pairGap = `${Math.pow(2, roundIndex) * 2}rem`;

        return (
          <div key={round.roundNumber} className={isLastRound ? "" : "mr-10"}>
            <h3 className="mb-4 text-center font-display text-sm tracking-[0.2em] text-gold uppercase">
              {isLastRound ? "Final" : `Round ${round.roundNumber}`}
            </h3>
            <div className="flex h-full flex-col justify-around" style={{ gap: pairGap }}>
              {pairs.map((pair, pairIndex) => (
                <div key={pairIndex} className="relative flex flex-col justify-around gap-4">
                  {pair.map((m) => (
                    <MatchupCard key={m.id} matchup={m} />
                  ))}
                  {!isLastRound && pair.length === 2 && (
                    <div
                      className="absolute top-1/4 bottom-1/4 left-full w-10 rounded-r-md border-t-2 border-r-2 border-b-2 border-gold/40"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
