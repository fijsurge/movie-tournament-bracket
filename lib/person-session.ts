import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { PERSON_COOKIE_NAME, signPersonSession, verifyPersonSession } from "@/lib/session-token";

export async function setPersonSession(personId: string, sessionVersion: number): Promise<void> {
  const store = await cookies();
  store.set(PERSON_COOKIE_NAME, signPersonSession(personId, sessionVersion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// Verifies the cookie's signature AND that its sessionVersion still matches
// the DB row — a bumped sessionVersion (from logout) invalidates every
// outstanding copy of the cookie, not just the one that logged out with.
export async function getPersonId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(PERSON_COOKIE_NAME)?.value;
  if (!raw) return null;

  const verified = verifyPersonSession(raw);
  if (!verified) return null;

  const person = await prisma.person.findUnique({
    where: { id: verified.personId },
    select: { sessionVersion: true },
  });
  if (!person || person.sessionVersion !== verified.sessionVersion) return null;

  return verified.personId;
}

export async function clearPersonSession(personId: string): Promise<void> {
  const store = await cookies();
  store.delete(PERSON_COOKIE_NAME);
  await prisma.person.update({ where: { id: personId }, data: { sessionVersion: { increment: 1 } } });
}
