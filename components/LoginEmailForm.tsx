"use client";

import { useActionState } from "react";
import { requestLoginLink, type RequestLoginLinkState } from "@/app/login/actions";
import { Spinner } from "@/components/shared/Spinner";

const initialState: RequestLoginLinkState = { error: null, sent: false };

export function LoginEmailForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(requestLoginLink, initialState);

  if (state.sent) {
    return <p className="text-sm text-cream-dim">Check your email for a login link.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          className="flex-1 rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50"
        >
          {pending ? <Spinner className="h-4 w-4 text-ink" /> : "Log in"}
        </button>
      </div>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </form>
  );
}
