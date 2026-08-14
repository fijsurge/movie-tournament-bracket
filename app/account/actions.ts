"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getPersonId } from "@/lib/person-session";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  avatar: z.string().max(200_000).optional(),
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
