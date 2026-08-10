import Image from "next/image";
import type { BracketStateRound } from "@/types/bracket";

function MatchupCard({ matchup }: { matchup: BracketStateRound["matchups"][number] }) {
  const aWon = matchup.winnerMovieId && matchup.winnerMovieId === matchup.movieA?.id;
  const bWon = matchup.winnerMovieId && matchup.winnerMovieId === matchup.movieB?.id;

  return (
    <div className="flex w-56 flex-col gap-1 rounded-lg border border-gold/20 bg-surface p-2">
      {[
        { movie: matchup.movieA, won: aWon },
        { movie: matchup.movieB, won: bWon },
      ].map((slot, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded border-l-2 px-2 py-1 ${
            slot.won ? "border-gold bg-gold/15 font-semibold text-gold" : "border-transparent text-cream-dim"
          }`}
        >
          {slot.movie?.posterUrl && (
            <Image src={slot.movie.posterUrl} alt="" width={24} height={36} className="rounded-sm" />
          )}
          <span className="truncate text-sm">
            {slot.movie?.title ?? (matchup.isBye ? "— bye —" : "TBD")}
          </span>
        </div>
      ))}
      {matchup.status === "NEEDS_MANUAL_TIEBREAK" && (
        <p className="text-center text-xs text-rose">Tie — admin deciding…</p>
      )}
    </div>
  );
}

export function BracketTree({ rounds }: { rounds: BracketStateRound[] }) {
  return (
    <div className="flex gap-8 overflow-x-auto p-4">
      {rounds.map((round) => (
        <div key={round.roundNumber} className="flex flex-col justify-around gap-6">
          <h3 className="text-center font-display text-sm tracking-[0.2em] text-gold uppercase">
            {round.roundNumber === rounds.length ? "Final" : `Round ${round.roundNumber}`}
          </h3>
          <div
            className="flex flex-1 flex-col justify-around gap-6"
            style={{ gap: `${Math.pow(2, round.roundNumber) * 0.75}rem` }}
          >
            {round.matchups.map((m) => (
              <MatchupCard key={m.id} matchup={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
