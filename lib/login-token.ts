import { randomUUID, createHash } from "node:crypto";

export const LOGIN_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Tokens are hashed at rest, so a freshly-requested link can't be resent
// verbatim — this cooldown instead skips minting (and emailing) a new token
// if one was issued very recently, so a double-click doesn't fire two emails.
export const LOGIN_TOKEN_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateLoginToken(): string {
  return randomUUID();
}

// Login tokens are only ever stored hashed (Person.loginTokenHash) — unlike
// Voter.inviteToken, a leaked plaintext login token would grant a full
// cross-bracket session, so it's never persisted in a readable form.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
