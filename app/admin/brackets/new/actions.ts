"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/slug";
import { createBracketSchema } from "@/lib/validation";

export interface CreateBracketState {
  error: string | null;
}

export async function createBracket(
  _prevState: CreateBracketState,
  formData: FormData,
): Promise<CreateBracketState> {
  await requireAdmin();

  const raw = {
    name: String(formData.get("name") ?? ""),
    categories: JSON.parse(String(formData.get("categoriesJson") ?? "[]")),
    nominationMode: String(formData.get("nominationMode") ?? "OPEN"),
    nominationCapPerVoter: formData.get("nominationCapPerVoter")
      ? Number(formData.get("nominationCapPerVoter"))
      : undefined,
    poolTargetSize: formData.get("poolTargetSize") ? Number(formData.get("poolTargetSize")) : undefined,
  };

  const parsed = createBracketSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const bracket = await prisma.bracket.create({
    data: {
      slug: slugify(data.name),
      name: data.name,
      nominationMode: data.nominationMode,
      nominationCapPerVoter: data.nominationCapPerVoter ?? null,
      poolTargetSize: data.poolTargetSize ?? null,
      categories: {
        create: data.categories.map((c, i) => ({
          key: c.key,
          label: c.label,
          isTiebreaker: c.isTiebreaker,
          order: i,
        })),
      },
    },
  });

  redirect(`/admin/brackets/${bracket.slug}`);
}
