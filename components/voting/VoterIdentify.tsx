"use client";

import { useActionState } from "react";
import { identifyVoter, type IdentifyVoterState } from "@/app/b/[slug]/actions";

const initialState: IdentifyVoterState = { error: null };

export function VoterIdentify({
  bracketId,
  redirectTo,
  existingVoterNames,
}: {
  bracketId: string;
  redirectTo: string;
  existingVoterNames: string[];
}) {
  const [state, formAction, pending] = useActionState(identifyVoter, initialState);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Who are you?</h2>

      {existingVoterNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingVoterNames.map((name) => (
            <form action={formAction} key={name}>
              <input type="hidden" name="bracketId" value={bracketId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="name" value={name} />
              <button
                type="submit"
                className="rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
              >
                {name}
              </button>
            </form>
          ))}
        </div>
      )}

      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="bracketId" value={bracketId} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <input
          name="name"
          placeholder="Type your name"
          required
          className="flex-1 rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "…" : "Go"}
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
