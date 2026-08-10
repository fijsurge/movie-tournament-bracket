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
      <h2 className="font-display text-xl tracking-wide text-gold uppercase">Who are you?</h2>

      {existingVoterNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingVoterNames.map((name) => (
            <form action={formAction} key={name}>
              <input type="hidden" name="bracketId" value={bracketId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="name" value={name} />
              <button type="submit" className="rounded-full border border-gold/40 px-3 py-1 text-sm transition hover:border-gold">
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
          className="flex-1 rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim disabled:opacity-50"
        >
          {pending ? "…" : "Go"}
        </button>
      </form>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </div>
  );
}
