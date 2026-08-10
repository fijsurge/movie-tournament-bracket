import Image from "next/image";
import type { BracketStateRound } from "@/types/bracket";

function MatchupCard({ matchup }: { matchup: BracketStateRound["matchups"][number] }) {
  const aWon = matchup.winnerMovieId && matchup.winnerMovieId === matchup.movieA?.id;
  const bWon = matchup.winnerMovieId && matchup.winnerMovieId === matchup.movieB?.id;

  return (
    <div className="flex w-56 flex-col gap-1 rounded-lg border border-neutral-700 bg-neutral-900 p-2">
      {[
        { movie: matchup.movieA, won: aWon },
        { movie: matchup.movieB, won: bWon },
      ].map((slot, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded px-2 py-1 ${
            slot.won ? "bg-emerald-900/60 font-semibold text-emerald-200" : "text-neutral-300"
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
        <p className="text-center text-xs text-amber-400">Tie — admin deciding…</p>
      )}
    </div>
  );
}

export function BracketTree({ rounds }: { rounds: BracketStateRound[] }) {
  return (
    <div className="flex gap-8 overflow-x-auto p-4">
      {rounds.map((round) => (
        <div key={round.roundNumber} className="flex flex-col justify-around gap-6">
          <h3 className="text-center text-sm font-medium tracking-wide text-neutral-400 uppercase">
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
