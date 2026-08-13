"use client";

import { useActionState, useState } from "react";
import { identifyVoter, type IdentifyVoterState } from "@/app/b/[slug]/actions";
import { Spinner } from "@/components/shared/Spinner";
import { Avatar } from "@/components/shared/Avatar";
import { AvatarPicker } from "@/components/voting/AvatarPicker";

const initialState: IdentifyVoterState = { error: null };

export function VoterIdentify({
  bracketId,
  redirectTo,
  existingVoters,
}: {
  bracketId: string;
  redirectTo: string;
  existingVoters: { name: string; avatar: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(identifyVoter, initialState);
  const [newName, setNewName] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl tracking-wide text-gold uppercase">Who are you?</h2>

      {existingVoters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingVoters.map((voter) => (
            <form action={formAction} key={voter.name}>
              <input type="hidden" name="bracketId" value={bracketId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="name" value={voter.name} />
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-full border border-gold/40 py-1 pr-3 pl-1 text-sm transition hover:border-gold active:scale-95 disabled:opacity-50"
              >
                <Avatar name={voter.name} avatar={voter.avatar} size="sm" />
                {voter.name}
              </button>
            </form>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="bracketId" value={bracketId} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <AvatarPicker name="avatar" displayName={newName} />
        <div className="flex gap-2">
          <input
            name="name"
            placeholder="Type your name"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50"
          >
            {pending ? <Spinner className="h-4 w-4 text-ink" /> : "Go"}
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <input
            name="email"
            type="email"
            placeholder="Email (optional)"
            className="rounded border border-gold/25 bg-surface px-3 py-2 text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
          />
          <p className="text-xs text-cream-dim">
            Add your email to save your name and avatar — they&apos;ll carry over the next time you join a bracket.
          </p>
        </div>
      </form>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </div>
  );
}
