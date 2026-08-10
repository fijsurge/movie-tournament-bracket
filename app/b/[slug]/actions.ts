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
  const parsed = identifyVoterSchema.safeParse({
    bracketId: String(formData.get("bracketId") ?? ""),
    name: String(formData.get("name") ?? ""),
    avatar: rawAvatar ? String(rawAvatar) : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }
  const { bracketId, name, avatar } = parsed.data;
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  const normalizedName = normalizeVoterName(name);
  const voter = await prisma.voter.upsert({
    where: { bracketId_normalizedName: { bracketId, normalizedName } },
    update: {},
    create: { bracketId, name: name.trim(), normalizedName, avatar: avatar || null },
  });

  await setVoterCookie(bracketId, voter.id);
  redirect(redirectTo);
}
