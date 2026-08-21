import { Avatar } from "@/components/shared/Avatar";
import type { BracketStateLeaderboardEntry } from "@/types/bracket";

// Live standings for the NCAA-pool-style points competition (see
// lib/scoring.ts) — visible throughout, not just at the reveal, so voters
// can track how they're doing round to round. Rendered wherever a
// leaderboard is present: TVView during ACTIVE, and the completed-bracket
// voter page.
export function ScoreLeaderboard({ entries }: { entries: BracketStateLeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-gold/20 bg-surface p-3">
      <p className="mb-2 font-display text-xs tracking-[0.2em] text-gold uppercase">Pool standings</p>
      <ul className="flex flex-col gap-1.5">
        {entries.map((entry, i) => (
          <li key={entry.voterId} className="flex items-center gap-2 text-sm">
            <span className="w-4 shrink-0 text-cream-dim">{i + 1}</span>
            <Avatar name={entry.voterName} avatar={entry.voterAvatar} size="sm" />
            <span className="flex-1 truncate">{entry.voterName}</span>
            <span className="font-medium text-gold">{entry.points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
