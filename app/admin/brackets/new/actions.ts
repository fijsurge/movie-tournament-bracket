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
    contentType: String(formData.get("contentType") ?? "MOVIE"),
    characterName: formData.get("characterName") ? String(formData.get("characterName")) : undefined,
    nominationCapPerVoter: formData.get("nominationCapPerVoter")
      ? Number(formData.get("nominationCapPerVoter"))
      : undefined,
    poolTargetSize: formData.get("poolTargetSize") ? Number(formData.get("poolTargetSize")) : undefined,
    filterPersonIds: formData.get("filterPersonIdsJson")
      ? JSON.parse(String(formData.get("filterPersonIdsJson")))
      : undefined,
    filterCompanyIds: formData.get("filterCompanyIdsJson")
      ? JSON.parse(String(formData.get("filterCompanyIdsJson")))
      : undefined,
    filterKeywordIds: formData.get("filterKeywordIdsJson")
      ? JSON.parse(String(formData.get("filterKeywordIdsJson")))
      : undefined,
    filterCollectionIds: formData.get("filterCollectionIdsJson")
      ? JSON.parse(String(formData.get("filterCollectionIdsJson")))
      : undefined,
    filterGenreIds: formData.get("filterGenreIdsJson")
      ? (JSON.parse(String(formData.get("filterGenreIdsJson"))) as number[])
      : undefined,
    filterYearMin: formData.get("filterYearMin") ? Number(formData.get("filterYearMin")) : undefined,
    filterYearMax: formData.get("filterYearMax") ? Number(formData.get("filterYearMax")) : undefined,
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
      contentType: data.contentType,
      characterName: data.characterName ?? null,
      nominationCapPerVoter: data.nominationCapPerVoter ?? null,
      poolTargetSize: data.poolTargetSize ?? null,
      filterPersonIds: data.filterPersonIds && data.filterPersonIds.length > 0 ? JSON.stringify(data.filterPersonIds) : null,
      filterCompanyIds:
        data.filterCompanyIds && data.filterCompanyIds.length > 0 ? JSON.stringify(data.filterCompanyIds) : null,
      filterKeywordIds:
        data.filterKeywordIds && data.filterKeywordIds.length > 0 ? JSON.stringify(data.filterKeywordIds) : null,
      filterCollectionIds:
        data.filterCollectionIds && data.filterCollectionIds.length > 0
          ? JSON.stringify(data.filterCollectionIds)
          : null,
      filterGenreIds:
        data.filterGenreIds && data.filterGenreIds.length > 0 ? JSON.stringify(data.filterGenreIds) : null,
      filterYearMin: data.filterYearMin ?? null,
      filterYearMax: data.filterYearMax ?? null,
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
