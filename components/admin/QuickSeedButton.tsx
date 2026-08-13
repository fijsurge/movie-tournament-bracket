"use client";

import { SubmitButton } from "@/components/shared/SubmitButton";

export function QuickSeedButton({ action, className }: { action: () => Promise<void>; className?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Quick seed using TMDb ratings? This ranks movies by their TMDb audience rating and generates the bracket immediately — any seed ratings your voters have already submitted are discarded.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton pendingLabel="Seeding…" className={className}>
        Quick seed (use TMDb ratings)
      </SubmitButton>
    </form>
  );
}
