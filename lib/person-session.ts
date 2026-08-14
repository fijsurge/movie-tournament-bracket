import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "person_id";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

function sign(personId: string, sessionVersion: number): string {
  const payload = `${personId}.${sessionVersion}`;
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(cookieValue: string): { personId: string; sessionVersion: number } | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [personId, versionStr, hmac] = parts;
  const sessionVersion = Number(versionStr);
  if (!personId || Number.isNaN(sessionVersion)) return null;

  const expected = createHmac("sha256", getSecret()).update(`${personId}.${sessionVersion}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(hmac, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) return null;

  return { personId, sessionVersion };
}

export async function setPersonSession(personId: string, sessionVersion: number): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(personId, sessionVersion), {
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
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const verified = verify(raw);
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
  store.delete(COOKIE_NAME);
  await prisma.person.update({ where: { id: personId }, data: { sessionVersion: { increment: 1 } } });
}
