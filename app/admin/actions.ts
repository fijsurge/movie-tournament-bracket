"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearAdminCookie, requireAdmin } from "@/lib/admin-auth";
import { getPersonId } from "@/lib/person-session";
import { prisma } from "@/lib/db";

export async function logoutAdmin(): Promise<void> {
  await clearAdminCookie();
  redirect("/");
}

// Requiring password-level access first is what authorizes granting the
// Person-level shortcut — this only ever links/unlinks the caller's own
// currently-logged-in Person, never someone else's. The "link" button only
// ever renders when the page has already confirmed a Person session exists
// (see app/admin/page.tsx), so a missing personId here is defensive, not a
// reachable user-facing error — same no-op-if-absent style as logoutPerson.
export async function linkGlobalAdmin(): Promise<void> {
  await requireAdmin();
  const personId = await getPersonId();
  if (personId) {
    await prisma.person.update({ where: { id: personId }, data: { isGlobalAdmin: true } });
  }
  revalidatePath("/admin");
}

export async function unlinkGlobalAdmin(): Promise<void> {
  await requireAdmin();
  const personId = await getPersonId();
  if (personId) {
    await prisma.person.update({ where: { id: personId }, data: { isGlobalAdmin: false } });
  }
  revalidatePath("/admin");
}
