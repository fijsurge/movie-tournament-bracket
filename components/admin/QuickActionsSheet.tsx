"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeNominations, closeSeeding, quickSeed, closeRound } from "@/app/admin/brackets/[slug]/actions";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { QuickSeedButton } from "@/components/admin/QuickSeedButton";
import { InviteVoters } from "@/components/admin/InviteVoters";
import { AdminAddMovie } from "@/components/admin/AdminAddMovie";
import { BoltIcon } from "@/components/shared/Icons";

const PRIMARY_BUTTON =
  "rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50";
const SECONDARY_BUTTON =
  "rounded-full border border-gold/40 px-3 py-1 text-sm text-cream transition hover:border-gold active:scale-95 disabled:opacity-50";

interface InvitedVoter {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export function QuickActionsSheet({
  bracketId,
  status,
  movieCount,
  currentRound,
  invitedVoters,
  excludeTmdbIds,
  hasFilters,
}: {
  bracketId: string;
  status: "NOMINATING" | "SEEDING" | "ACTIVE";
  movieCount: number;
  currentRound: number | null;
  invitedVoters: InvitedVoter[];
  excludeTmdbIds: number[];
  hasFilters: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const closeNominationsForBracket = closeNominations.bind(null, bracketId);
  const closeSeedingForBracket = closeSeeding.bind(null, bracketId);
  const quickSeedForBracket = quickSeed.bind(null, bracketId);
  const closeRoundForBracket = closeRound.bind(null, bracketId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Admin quick actions"
        className="fixed right-4 bottom-[calc(4.75rem+1rem+env(safe-area-inset-bottom))] z-[35] flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink shadow-[0_8px_24px_-6px_rgba(232,163,61,0.6)] transition active:scale-95"
      >
        <BoltIcon className="h-6 w-6" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="font-display text-lg tracking-wide text-gold uppercase">Quick actions</h2>

        {status === "NOMINATING" && (
          <div className="mt-3 flex flex-col gap-4">
            <InviteVoters bracketId={bracketId} invitedVoters={invitedVoters} onSuccess={() => router.refresh()} />
            <AdminAddMovie bracketId={bracketId} excludeTmdbIds={excludeTmdbIds} hasFilters={hasFilters} />
            <form action={closeNominationsForBracket}>
              <SubmitButton disabled={movieCount < 2} pendingLabel="Closing…" className={PRIMARY_BUTTON}>
                Close nominations &amp; move to seeding
              </SubmitButton>
            </form>
          </div>
        )}

        {status === "SEEDING" && (
          <div className="mt-3 flex flex-col gap-3">
            <form action={closeSeedingForBracket}>
              <SubmitButton pendingLabel="Generating…" className={PRIMARY_BUTTON}>
                Close seeding &amp; generate bracket
              </SubmitButton>
            </form>
            <QuickSeedButton action={quickSeedForBracket} className={SECONDARY_BUTTON} />
          </div>
        )}

        {status === "ACTIVE" && (
          <div className="mt-3 flex flex-col gap-3">
            {currentRound !== null && <p className="text-sm font-medium text-gold">Round {currentRound}</p>}
            <form action={closeRoundForBracket}>
              <SubmitButton pendingLabel="Closing round…" className={PRIMARY_BUTTON}>
                Close round &amp; advance
              </SubmitButton>
            </form>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
