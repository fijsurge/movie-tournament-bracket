import "server-only";
import { cookies } from "next/headers";

function cookieName(bracketId: string): string {
  return `voter_${bracketId}`;
}

export async function getVoterId(bracketId: string): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieName(bracketId))?.value ?? null;
}

export async function setVoterCookie(bracketId: string, voterId: string): Promise<void> {
  const store = await cookies();
  store.set(cookieName(bracketId), voterId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function normalizeVoterName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
