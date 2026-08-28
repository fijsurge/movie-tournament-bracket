"use client";

import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { confirmRoundVote } from "@/app/b/[slug]/vote/actions";
import { Spinner } from "@/components/shared/Spinner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Appears once every invited voter has voted on every open matchup in the
// current round — the round is now in its review window (Round.closesAt)
// rather than already closed, giving anyone a last look before it does.
// Reads the same SWR cache entry PhaseWatcher already polls (identical key,
// no refreshInterval of its own) rather than running a second independent
// timer against the same endpoint — two same-key pollers on one page can
// drift out of each other's dedupe window and roughly double the request
// rate instead of sharing one.
export function RoundReviewBanner({
  bracketId,
  slug,
  voterId,
  currentRound,
}: {
  bracketId: string;
  slug: string;
  voterId: string;
  currentRound: number;
}) {
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher);
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const round = data?.rounds.find((r) => r.roundNumber === currentRound);
  const closesAt = round?.closesAt ?? null;

  useEffect(() => {
    if (!closesAt) {
      // Syncs local countdown state to the polled closesAt boundary going
      // away (round left review, or closed) — not a render-loop concern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsLeft(null);
      return;
    }
    const deadline = new Date(closesAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [closesAt]);

  if (!round || !closesAt) return null;

  const confirmed = round.confirmedVoterIds.includes(voterId);
  const confirmedCount = round.confirmedVoterIds.length;
  const totalInvited = data?.bracket.invitedVoterCount ?? 0;

  function handleConfirm() {
    startTransition(async () => {
      await confirmRoundVote(bracketId);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/25 bg-ink/40 p-3">
      <div className="text-sm">
        <p className="text-cream">
          Everyone&apos;s voted — round closes in{" "}
          <span className="font-medium text-gold">{secondsLeft ?? "…"}s</span>.
        </p>
        <p className="text-xs text-cream-dim">
          Review your picks above, then confirm. {confirmedCount}/{totalInvited} confirmed.
        </p>
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirmed || pending}
        className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" />
          </span>
        ) : confirmed ? (
          "✓ Confirmed"
        ) : (
          "Confirm my picks"
        )}
      </button>
    </div>
  );
}
