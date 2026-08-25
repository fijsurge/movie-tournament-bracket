"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getPersonId } from "@/lib/person-session";

// Resized photo uploads and emoji presets are tiny, but a generated
// avatar (a real 512x512/512x768 PNG data URI) comes in around 500KB-1MB
// uncompressed to base64 — comfortable headroom above that, not sized to
// the old photo-upload cap this was originally set for.
const AVATAR_MAX_LENGTH = 3_000_000;

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  avatar: z.string().max(AVATAR_MAX_LENGTH, "That avatar is too large to save").optional(),
});

export interface UpdateProfileState {
  error: string | null;
  saved: boolean;
}

export async function updatePersonProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const personId = await getPersonId();
  if (!personId) {
    return { error: "You need to log in first", saved: false };
  }

  const rawAvatar = formData.get("avatar");
  const parsed = updateProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    avatar: rawAvatar ? String(rawAvatar) : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", saved: false };
  }

  await prisma.person.update({
    where: { id: personId },
    data: { name: parsed.data.name.trim(), avatar: parsed.data.avatar || null },
  });

  revalidatePath("/account");
  return { error: null, saved: true };
}
