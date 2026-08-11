// Pure phase-routing logic — no I/O, so it's safe to import from Server
// Components (app/b/[slug]/page.tsx) and Client Components (PhaseWatcher)
// alike, and easy to unit test.

export type BracketPhaseStatus = "SETUP" | "NOMINATING" | "SEEDING" | "ACTIVE" | "COMPLETE";

// Where a voter belongs right now given the bracket's current phase — null
// when nothing has opened yet and there's no single "current" page to send
// them to.
export function phaseHref(bracket: {
  slug: string;
  status: BracketPhaseStatus;
  nominationMode: "OPEN" | "DRAFT";
}): string | null {
  switch (bracket.status) {
    case "NOMINATING":
      return `/b/${bracket.slug}/${bracket.nominationMode === "DRAFT" ? "draft" : "nominate"}`;
    case "SEEDING":
      return `/b/${bracket.slug}/seed`;
    case "ACTIVE":
    case "COMPLETE":
      // COMPLETE also lands on /vote — it already renders the champion banner.
      return `/b/${bracket.slug}/vote`;
    default:
      return null;
  }
}

// Copy for the transition takeover a voter sees when the phase changes (or a
// new round opens) while they're sitting on the page. Pass roundNumber only
// for a same-status round advance — omit/null it for an actual phase change.
export function phaseTransitionCopy(
  toStatus: BracketPhaseStatus,
  roundNumber: number | null,
): { headline: string; subline: string } {
  if (roundNumber !== null) {
    return { headline: `🥊 Round ${roundNumber} is open!`, subline: "Get your votes in…" };
  }
  switch (toStatus) {
    case "NOMINATING":
      return { headline: "🎟️ Nominations are open!", subline: "Add your picks…" };
    case "SEEDING":
      return { headline: "🍿 Nominations are in!", subline: "Time to rate the pool…" };
    case "ACTIVE":
      return { headline: "🎬 Seeding's done!", subline: "The bracket is set — let's vote!" };
    case "COMPLETE":
      return { headline: "🏆 We have a champion!", subline: "See who won…" };
    default:
      return { headline: "Moving on…", subline: "" };
  }
}
