import { prisma } from "@/lib/db";
import { isBracketAdmin } from "@/lib/bracket-auth";
import { effectiveVoterName, effectiveVoterAvatar } from "@/lib/voter-display";
import { buildFilterSummary } from "@/lib/bracket-filters";
import { QuickActionsSheet } from "@/components/admin/QuickActionsSheet";

// Self-gating: runs its own independent query rather than threading data
// down from whichever of BracketNav's many render sites happens to mount
// it — those sites already fetch different shapes of the bracket, and this
// returns voter emails (via invitedVoters), which shouldn't ride along on a
// query that isn't already admin-gated. The bracket is fetched before
// gating (rather than after) since isBracketAdmin needs its id.
export async function QuickActionsButton({ slug }: { slug: string }) {
  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      contentType: true,
      characterName: true,
      currentRound: true,
      voters: { include: { person: true } },
      movies: { select: { tmdbId: true } },
      filterPersonIds: true,
      filterCompanyIds: true,
      filterKeywordIds: true,
      filterCollectionIds: true,
      filterGenreIds: true,
      filterYearMin: true,
      filterYearMax: true,
    },
  });

  if (!bracket || bracket.status === "SETUP" || bracket.status === "COMPLETE") return null;
  if (!(await isBracketAdmin(bracket.id))) return null;

  const invitedVoters = bracket.voters
    .filter((v): v is typeof v & { email: string } => v.email !== null)
    .map((v) => ({
      id: v.id,
      name: effectiveVoterName(v),
      email: v.email,
      avatar: effectiveVoterAvatar(v),
    }));

  const { hasFilters } = buildFilterSummary(bracket);

  return (
    <QuickActionsSheet
      bracketId={bracket.id}
      status={bracket.status}
      contentType={bracket.contentType}
      characterName={bracket.characterName}
      movieCount={bracket.movies.length}
      currentRound={bracket.currentRound}
      invitedVoters={invitedVoters}
      excludeTmdbIds={bracket.movies.map((m) => m.tmdbId)}
      hasFilters={hasFilters}
    />
  );
}
