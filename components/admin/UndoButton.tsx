"use client";

import { SubmitButton } from "@/components/shared/SubmitButton";

export function UndoButton({ action, className }: { action: () => Promise<void>; className?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Undo the last phase change? This reopens the phase that just closed — any resolved matchups from it go back to open, and this also pauses auto-advance so it doesn't just re-close.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton pendingLabel="Undoing…" className={className}>
        Undo last phase
      </SubmitButton>
    </form>
  );
}
