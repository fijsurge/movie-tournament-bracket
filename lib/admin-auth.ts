import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPersonId } from "@/lib/person-session";

const COOKIE_NAME = "admin_auth";

// The shared password stays the source of truth (and the cheap fast path —
// checked first, no DB read); a logged-in Person who's been linked as a
// global admin (see app/admin/actions.ts's linkGlobalAdmin) is an additive
// shortcut, not a replacement.
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  if (store.get(COOKIE_NAME)?.value === getAdminPassword()) return true;

  const personId = await getPersonId();
  if (!personId) return false;
  const person = await prisma.person.findUnique({ where: { id: personId }, select: { isGlobalAdmin: true } });
  return person?.isGlobalAdmin ?? false;
}

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  return password;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, getAdminPassword(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
