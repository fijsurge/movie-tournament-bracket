"use client";

import { SubmitButton } from "@/components/shared/SubmitButton";

export function DeleteBracketButton({
  action,
  bracketName,
  className,
}: {
  action: () => Promise<void>;
  bracketName: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Permanently delete "${bracketName}"? This removes every movie, vote, and voter in it — there is no undo. If you just want it out of the way, use Archive instead.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton pendingLabel="Deleting…" className={className}>
        Delete bracket
      </SubmitButton>
    </form>
  );
}
