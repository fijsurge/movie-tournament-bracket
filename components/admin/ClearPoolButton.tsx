"use client";

import { SubmitButton } from "@/components/shared/SubmitButton";

export function ClearPoolButton({
  action,
  disabled,
  className,
}: {
  action: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Clear the entire nomination pool? This removes every nominated movie and, if a draft is underway, resets it back to \"Start draft\". This can't be undone — everyone would need to re-nominate.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton pendingLabel="Clearing…" disabled={disabled} className={className}>
        Clear pool
      </SubmitButton>
    </form>
  );
}
