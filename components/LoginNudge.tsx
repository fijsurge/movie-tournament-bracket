import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { getPersonId } from "@/lib/person-session";
import { requestLoginLink } from "@/app/login/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";

// A plain <form action> must return void | Promise<void>, unlike the
// useActionState-shaped requestLoginLink — this thin wrapper just discards
// the return value (only reachable on a validation failure, which can't
// happen here since the email is a known-verified Person record). Needs its
// own "use server" directive (not just importing from a "use server" file)
// since it's passed into SubmitButton, a Client Component, inside the form
// tree below — only a real Server Action reference can cross that boundary.
async function requestLoginLinkAction(formData: FormData): Promise<void> {
  "use server";
  await requestLoginLink({ error: null }, formData);
}

// Only ever shows for someone who's already proven their email (clicked a
// real invite link) but hasn't started a login session yet — never for a
// self-typed, unverified email. One tap fires the same magic-link flow as
// the dedicated /login page, with nothing to retype: the email travels as a
// hidden form field, never a URL query param.
export async function LoginNudge({ bracketId, next }: { bracketId: string; next: string }) {
  if (await getPersonId()) return null;

  const voterId = await getVoterId(bracketId);
  if (!voterId) return null;

  const voter = await prisma.voter.findUnique({ where: { id: voterId }, include: { person: true } });
  if (!voter?.person?.emailVerifiedAt) return null;

  return (
    <form
      action={requestLoginLinkAction}
      className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-surface p-3 text-sm"
    >
      <input type="hidden" name="email" value={voter.person.email} />
      <input type="hidden" name="next" value={next} />
      <span className="text-cream-dim">See this bracket (and any others) next time you visit.</span>
      <SubmitButton
        pendingLabel="…"
        className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-gold-dim active:scale-95"
      >
        Log in as {voter.person.email}
      </SubmitButton>
    </form>
  );
}
