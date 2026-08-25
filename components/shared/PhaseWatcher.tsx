"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import useSWR from "swr";
import type { BracketState } from "@/types/bracket";
import { phaseHref, phaseTransitionCopy, type BracketPhaseStatus } from "@/lib/phase-nav";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Transition {
  href: string;
  headline: string;
  subline: string;
}

// Invisible poller that watches for the bracket's phase (or, during ACTIVE
// voting, the current round) changing underneath a voter who's just sitting
// on the page — without this, a phase advance only used to show up after the
// voter manually navigated away and back, landing on a dead-end "not open
// right now" message. When it detects a change it plays a brief full-screen
// takeover, then navigates to wherever that phase actually lives.
export function PhaseWatcher({
  slug,
  status,
  currentRound = null,
}: {
  slug: string;
  status: BracketPhaseStatus;
  currentRound?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useSWR<BracketState>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });
  const [transition, setTransition] = useState<Transition | null>(null);
  // What we've already reacted to — updated the moment we register a
  // transition, not when the refreshed props eventually arrive, so clearing
  // `transition` after a same-page router.refresh() doesn't immediately
  // recompute the same change as "new" again and re-trigger in a loop.
  const [seen, setSeen] = useState<{ status: BracketPhaseStatus; round: number | null }>({
    status,
    round: currentRound,
  });
  // Ref, not state — this is purely "has the effect below already run once
  // for the first fingerprint," not a value that should ever drive a
  // re-render itself.
  const hasFingerprintBaseline = useRef(false);

  const liveRound = data ? (data.rounds.find((r) => r.status === "VOTING_OPEN")?.roundNumber ?? null) : null;
  const liveStatus = data?.bracket.status ?? null;
  const changed =
    liveStatus !== null &&
    (liveStatus !== seen.status || (liveStatus === "ACTIVE" && liveRound !== null && liveRound !== seen.round));

  // A tie entering/leaving NEEDS_MANUAL_TIEBREAK, an auto-reopened revote, a
  // coin flip landing — none of these move bracket.status or the round
  // number, so the check above alone never notices them, and a voter's page
  // just keeps showing a now-stale set of open matchups until they manually
  // reload. Fingerprinting the current round's own matchup statuses catches
  // these too, without treating them as a takeover-worthy phase transition —
  // just a quiet re-render so the page reflects reality.
  //
  // forceCategoryVoting has to be part of this fingerprint too, not just
  // status: an auto-reopen after a first tie leaves status at "OPEN" (it
  // was already open), so a round with only that one matchup open — the
  // final, or any round down to its last live pairing — would otherwise
  // see an unchanged fingerprint and never refresh at all.
  const currentRoundMatchups = data?.rounds.find((r) => r.roundNumber === liveRound)?.matchups ?? [];
  const matchupFingerprint = currentRoundMatchups
    .map((m) => `${m.id}:${m.status}:${m.forceCategoryVoting}`)
    .join(",");

  if (data && changed && !transition) {
    const dest = phaseHref({ slug, status: data.bracket.status, nominationMode: data.bracket.nominationMode });
    const isRoundOnly = data.bracket.status === seen.status;
    const copy = phaseTransitionCopy(data.bracket.status, isRoundOnly ? liveRound : null);
    setTransition({ href: dest ?? `/b/${slug}`, ...copy });
    setSeen({ status: data.bracket.status, round: liveRound });
  }

  // The effect's own dependency array is the change detector here — it
  // only re-runs when matchupFingerprint's *value* actually differs from
  // the previous render, so there's no need to separately track "the last
  // seen fingerprint" as state. router.refresh() is a real side effect (a
  // server round-trip), so it belongs in an effect, not render itself —
  // unlike the setState-during-render above, which is React's documented
  // pattern for deriving state from props. Skipped while `transition` is
  // set: a real phase change is already being staged/played this poll,
  // and skipped on the very first fingerprint — nothing changed *from*
  // yet, there's just a baseline to record.
  useEffect(() => {
    if (!matchupFingerprint || transition) return;
    if (!hasFingerprintBaseline.current) {
      hasFingerprintBaseline.current = true;
      return;
    }
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchupFingerprint]);

  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(() => {
      // A round advancing lands on the same URL we're already on (still
      // /vote, just a new round) — router.push() to an unchanged pathname
      // isn't guaranteed to bypass the client router cache (nothing calls
      // revalidatePath for voter-facing routes), so the old round's
      // matchups could keep showing. router.refresh() forces a genuinely
      // fresh server render for that case; push() is for an actual phase
      // change, landing on a different page for the first time (which also
      // unmounts this component, so no explicit cleanup is needed there).
      if (transition.href === pathname) {
        router.refresh();
        setTransition(null);
      } else {
        router.push(transition.href);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [transition, router, pathname]);

  return (
    <AnimatePresence>
      {transition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 overflow-hidden bg-ink p-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1.8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute h-[480px] w-[480px] rounded-full bg-gold/25 blur-3xl"
            aria-hidden="true"
          />
          <motion.p
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
            className="font-display text-3xl tracking-wide text-gold uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.4)]"
          >
            {transition.headline}
          </motion.p>
          {transition.subline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-rose"
            >
              {transition.subline}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
