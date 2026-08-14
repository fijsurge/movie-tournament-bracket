import { describe, expect, it } from "vitest";
import { matchesFilters, type TmdbRawMovie } from "./tmdb-filters";

const COMEDY = 35;
const ROMANCE = 10749;

function movie(genreIds: number[]): TmdbRawMovie {
  return { id: 1, title: "Test Movie", release_date: "2000-01-01", genre_ids: genreIds };
}

describe("matchesFilters — genre AND semantics", () => {
  it("excludes a movie missing one of several selected genres", () => {
    // Comedy-only, e.g. Anchorman — must not pass a Comedy+Romance ("romantic comedy") filter.
    expect(matchesFilters(movie([COMEDY]), { genreIds: [COMEDY, ROMANCE] })).toBe(false);
  });

  it("includes a movie matching every selected genre", () => {
    expect(matchesFilters(movie([COMEDY, ROMANCE]), { genreIds: [COMEDY, ROMANCE] })).toBe(true);
  });

  it("includes a movie with extra genres beyond the selected ones", () => {
    expect(matchesFilters(movie([COMEDY, ROMANCE, 18]), { genreIds: [COMEDY, ROMANCE] })).toBe(true);
  });

  it("passes everything when no genre filter is set", () => {
    expect(matchesFilters(movie([]), {})).toBe(true);
  });
});
