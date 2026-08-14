import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchFilteredMovies, type MovieFilters } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const bracketId = searchParams.get("bracketId");

  let filters: MovieFilters = {};
  if (bracketId) {
    const bracket = await prisma.bracket.findUnique({
      where: { id: bracketId },
      select: {
        filterPersonIds: true,
        filterCompanyIds: true,
        filterKeywordIds: true,
        filterCollectionIds: true,
        filterGenreIds: true,
        filterYearMin: true,
        filterYearMax: true,
      },
    });
    if (bracket) {
      const ids = (json: string | null) =>
        json ? (JSON.parse(json) as { id: number; name: string }[]).map((p) => p.id) : null;
      filters = {
        personIds: ids(bracket.filterPersonIds),
        companyIds: ids(bracket.filterCompanyIds),
        keywordIds: ids(bracket.filterKeywordIds),
        collectionIds: ids(bracket.filterCollectionIds),
        genreIds: bracket.filterGenreIds ? (JSON.parse(bracket.filterGenreIds) as number[]) : null,
        yearMin: bracket.filterYearMin,
        yearMax: bracket.filterYearMax,
      };
    }
  }

  try {
    const results = await searchFilteredMovies(query, filters);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 502 });
  }
}
