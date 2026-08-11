"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";

const saveProfileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  avatar: z.string().max(200_000).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export interface AccountFormState {
  error: string | null;
  saved: boolean;
}

export async function saveAccountProfile(
  bracketId: string,
  slug: string,
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const voterId = await getVoterId(bracketId);
  if (!voterId) {
    return { error: "You need to join this bracket first", saved: false };
  }

  const rawAvatar = formData.get("avatar");
  const rawEmail = formData.get("email");
  const parsed = saveProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    avatar: rawAvatar ? String(rawAvatar) : undefined,
    email: rawEmail ? String(rawEmail) : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", saved: false };
  }
  const { name, avatar, email } = parsed.data;

  const voter = await prisma.voter.findUniqueOrThrow({ where: { id: voterId } });

  if (voter.personId) {
    // Already linked — just update their existing persistent profile.
    await prisma.person.update({
      where: { id: voter.personId },
      data: { name: name.trim(), avatar: avatar || null },
    });
  } else {
    // Not linked yet — upgrading an ephemeral self-joined voter to a
    // persistent one requires an email as the identity anchor.
    if (!email) {
      return { error: "Add an email to save your profile across brackets", saved: false };
    }
    const person = await prisma.person.upsert({
      where: { email },
      update: {},
      create: { email, name: name.trim(), avatar: avatar || null },
    });
    await prisma.voter.update({
      where: { id: voter.id },
      data: { personId: person.id, email },
    });
  }

  revalidatePath(`/b/${slug}`);
  revalidatePath(`/b/${slug}/account`);
  return { error: null, saved: true };
}
