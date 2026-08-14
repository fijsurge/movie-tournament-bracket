import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPersonId } from "@/lib/person-session";

// Global admin (password or a linked account, see lib/admin-auth.ts) always
// has full access; a bracket-scoped admin only gets this one bracket, via a
// Voter row with role: ADMIN linked to the currently logged-in Person.
export async function isBracketAdmin(bracketId: string): Promise<boolean> {
  if (await isAdminAuthenticated()) return true;

  const personId = await getPersonId();
  if (!personId) return false;

  const voter = await prisma.voter.findFirst({ where: { bracketId, personId, role: "ADMIN" } });
  return voter !== null;
}

export async function requireBracketAdmin(bracketId: string): Promise<void> {
  if (!(await isBracketAdmin(bracketId))) {
    redirect("/admin/login");
  }
}
