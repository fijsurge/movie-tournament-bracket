import { describe, expect, it } from "vitest";
import { phaseHref, phaseTransitionCopy } from "./phase-nav";

describe("phaseHref", () => {
  it("routes NOMINATING to the open-nominate page by default", () => {
    expect(phaseHref({ slug: "movie-night", status: "NOMINATING", nominationMode: "OPEN" })).toBe(
      "/b/movie-night/nominate",
    );
  });

  it("routes NOMINATING to the draft page for draft mode", () => {
    expect(phaseHref({ slug: "movie-night", status: "NOMINATING", nominationMode: "DRAFT" })).toBe(
      "/b/movie-night/draft",
    );
  });

  it("routes SEEDING to the seed page", () => {
    expect(phaseHref({ slug: "movie-night", status: "SEEDING", nominationMode: "OPEN" })).toBe("/b/movie-night/seed");
  });

  it("routes ACTIVE to the vote page", () => {
    expect(phaseHref({ slug: "movie-night", status: "ACTIVE", nominationMode: "OPEN" })).toBe("/b/movie-night/vote");
  });

  it("routes COMPLETE to the vote page, which shows the champion", () => {
    expect(phaseHref({ slug: "movie-night", status: "COMPLETE", nominationMode: "OPEN" })).toBe(
      "/b/movie-night/vote",
    );
  });

  it("has no destination for SETUP — nothing has opened yet", () => {
    expect(phaseHref({ slug: "movie-night", status: "SETUP", nominationMode: "OPEN" })).toBeNull();
  });
});

describe("phaseTransitionCopy", () => {
  it("prioritizes a round-number change over the status when both are given", () => {
    const copy = phaseTransitionCopy("ACTIVE", 2);
    expect(copy.headline).toContain("Round 2");
  });

  it("describes a status change to SEEDING when no round number is given", () => {
    const copy = phaseTransitionCopy("SEEDING", null);
    expect(copy.headline).toContain("Nominations are in");
  });

  it("describes a status change to ACTIVE when no round number is given", () => {
    const copy = phaseTransitionCopy("ACTIVE", null);
    expect(copy.headline).toContain("Seeding's done");
  });

  it("describes a status change to COMPLETE", () => {
    const copy = phaseTransitionCopy("COMPLETE", null);
    expect(copy.headline).toContain("champion");
  });
});
