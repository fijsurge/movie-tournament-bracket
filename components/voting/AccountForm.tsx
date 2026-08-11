"use client";

import { useActionState, useState } from "react";
import { saveAccountProfile, type AccountFormState } from "@/app/b/[slug]/account/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { AvatarPicker } from "@/components/voting/AvatarPicker";

const initialState: AccountFormState = { error: null, saved: false };

export function AccountForm({
  bracketId,
  slug,
  currentName,
  currentAvatar,
  currentEmail,
  isLinked,
}: {
  bracketId: string;
  slug: string;
  currentName: string;
  currentAvatar: string | null;
  currentEmail: string | null;
  isLinked: boolean;
}) {
  const action = saveAccountProfile.bind(null, bracketId, slug);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState(currentName);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AvatarPicker name="avatar" displayName={name} initialValue={currentAvatar ?? ""} />

      <label className="flex flex-col gap-1 text-sm text-cream-dim">
        Name
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream focus:border-gold focus:outline-none"
        />
      </label>

      {isLinked ? (
        <p className="text-xs text-cream-dim">
          Linked to {currentEmail} — this name and avatar follow you into every bracket you join with that
          email.
        </p>
      ) : (
        <label className="flex flex-col gap-1 text-sm text-cream-dim">
          Email (add this to save your profile across brackets)
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
          />
        </label>
      )}

      <SubmitButton
        pendingLabel="Saving…"
        className="self-start rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim disabled:opacity-50"
      >
        Save
      </SubmitButton>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {!pending && state.saved && !state.error && <p className="text-sm text-cream-dim">Saved!</p>}
    </form>
  );
}
