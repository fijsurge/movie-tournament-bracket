"use client";

import { useActionState, useState } from "react";
import { updatePersonProfile, type UpdateProfileState } from "@/app/account/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { AvatarPicker } from "@/components/voting/AvatarPicker";

const initialState: UpdateProfileState = { error: null, saved: false };

export function PersonProfileForm({
  currentName,
  currentAvatar,
}: {
  currentName: string;
  currentAvatar: string | null;
}) {
  const [state, formAction, pending] = useActionState(updatePersonProfile, initialState);
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

      <SubmitButton
        pendingLabel="Saving…"
        className="self-start rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50"
      >
        Save
      </SubmitButton>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {!pending && state.saved && !state.error && <p className="text-sm text-cream-dim">Saved!</p>}
    </form>
  );
}
