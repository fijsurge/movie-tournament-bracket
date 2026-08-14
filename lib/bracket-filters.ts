import { TMDB_GENRES } from "@/lib/genres";

interface IdNamePair {
  id: number;
  name: string;
}

export interface BracketFilterColumns {
  filterPersonIds: string | null;
  filterCompanyIds: string | null;
  filterKeywordIds: string | null;
  filterCollectionIds: string | null;
  filterGenreIds: string | null;
  filterYearMin: number | null;
  filterYearMax: number | null;
}

function parseNames(json: string | null): string[] {
  if (!json) return [];
  return (JSON.parse(json) as IdNamePair[]).map((p) => p.name);
}

// Shared by the admin dashboard's read-only summary and the nomination
// screen's "Search is scoped to: …" line so the two never drift apart.
export function buildFilterSummary(bracket: BracketFilterColumns): {
  hasFilters: boolean;
  filterSummary: string | null;
} {
  const genreIds = bracket.filterGenreIds ? (JSON.parse(bracket.filterGenreIds) as number[]) : [];

  const filterParts = [
    ...parseNames(bracket.filterPersonIds),
    ...parseNames(bracket.filterCompanyIds),
    ...parseNames(bracket.filterKeywordIds),
    ...parseNames(bracket.filterCollectionIds),
    genreIds.length > 0
      ? genreIds.map((id) => TMDB_GENRES.find((g) => g.id === id)?.name).filter(Boolean).join("/")
      : null,
    bracket.filterYearMin || bracket.filterYearMax
      ? `${bracket.filterYearMin ?? "…"}-${bracket.filterYearMax ?? "…"}`
      : null,
  ].filter(Boolean);

  const hasFilters = filterParts.length > 0;
  return { hasFilters, filterSummary: hasFilters ? filterParts.join(" · ") : null };
}
