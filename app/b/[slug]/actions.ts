"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setVoterCookie, normalizeVoterName } from "@/lib/voter-cookie";
import { identifyVoterSchema } from "@/lib/validation";

export interface IdentifyVoterState {
  error: string | null;
}

export async function identifyVoter(
  _prevState: IdentifyVoterState,
  formData: FormData,
): Promise<IdentifyVoterState> {
  const rawAvatar = formData.get("avatar");
  const rawEmail = formData.get("email");
  const parsed = identifyVoterSchema.safeParse({
    bracketId: String(formData.get("bracketId") ?? ""),
    name: String(formData.get("name") ?? ""),
    avatar: rawAvatar ? String(rawAvatar) : undefined,
    email: rawEmail ? String(rawEmail) : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }
  const { bracketId, name, avatar, email } = parsed.data;
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  let voter;
  if (email) {
    // Link to (or create) a persistent Person — its saved name/avatar win
    // over whatever was just typed here, same rule as the admin invite flow.
    const person = await prisma.person.upsert({
      where: { email },
      update: {},
      create: { email, name: name.trim(), avatar: avatar || null },
    });
    const normalizedName = normalizeVoterName(person.name);
    voter = await prisma.voter.upsert({
      where: { bracketId_normalizedName: { bracketId, normalizedName } },
      update: { personId: person.id, email },
      create: { bracketId, name: person.name, normalizedName, personId: person.id, email },
    });
  } else {
    const normalizedName = normalizeVoterName(name);
    voter = await prisma.voter.upsert({
      where: { bracketId_normalizedName: { bracketId, normalizedName } },
      update: {},
      create: { bracketId, name: name.trim(), normalizedName, avatar: avatar || null },
    });
  }

  await setVoterCookie(bracketId, voter.id);
  redirect(redirectTo);
}
