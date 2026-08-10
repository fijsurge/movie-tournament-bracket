"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/login/actions";
import { Spinner } from "@/components/shared/Spinner";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        placeholder="Admin password"
        required
        autoFocus
        className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none"
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim disabled:opacity-50"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" /> Checking…
          </span>
        ) : (
          "Log in"
        )}
      </button>
    </form>
  );
}
