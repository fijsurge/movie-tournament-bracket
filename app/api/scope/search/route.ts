import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { searchPeople, searchCompanies, searchKeywords, searchCollections } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const PER_TYPE_LIMIT = 5;
const TOTAL_LIMIT = 20;

export interface ScopeSearchResult {
  type: "person" | "company" | "keyword" | "collection";
  id: number;
  name: string;
  imageUrl: string | null;
}

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const [people, companies, keywords, collections] = await Promise.all([
      searchPeople(query),
      searchCompanies(query),
      searchKeywords(query),
      searchCollections(query),
    ]);

    const results: ScopeSearchResult[] = [
      ...people.slice(0, PER_TYPE_LIMIT).map((p) => ({
        type: "person" as const,
        id: p.personId,
        name: p.name,
        imageUrl: p.profileUrl,
      })),
      ...companies.slice(0, PER_TYPE_LIMIT).map((c) => ({
        type: "company" as const,
        id: c.companyId,
        name: c.name,
        imageUrl: c.logoUrl,
      })),
      ...keywords.slice(0, PER_TYPE_LIMIT).map((k) => ({
        type: "keyword" as const,
        id: k.keywordId,
        name: k.name,
        imageUrl: null,
      })),
      ...collections.slice(0, PER_TYPE_LIMIT).map((c) => ({
        type: "collection" as const,
        id: c.collectionId,
        name: c.name,
        imageUrl: c.posterUrl,
      })),
    ].slice(0, TOTAL_LIMIT);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 502 });
  }
}
