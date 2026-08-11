// Pure completion checks for auto-advance — no I/O, so these are easy to
// unit test and safe to import from anywhere (unlike lib/phase-transitions.ts,
// which is server-only since it touches the database).

export function isNominationComplete(
  invitedVoterIds: string[],
  nominationCounts: Record<string, number>,
  capPerVoter: number,
): boolean {
  if (invitedVoterIds.length === 0) return false;
  return invitedVoterIds.every((id) => (nominationCounts[id] ?? 0) >= capPerVoter);
}

export function isSeedingComplete(
  invitedVoterIds: string[],
  seedVoteCounts: Record<string, number>,
  movieCount: number,
): boolean {
  if (invitedVoterIds.length === 0 || movieCount < 2) return false;
  return invitedVoterIds.every((id) => (seedVoteCounts[id] ?? 0) >= movieCount);
}

export function isRoundComplete(invitedVoterIds: string[], openMatchupIds: string[], votedPairs: Set<string>): boolean {
  if (invitedVoterIds.length === 0 || openMatchupIds.length === 0) return false;
  return openMatchupIds.every((matchupId) => invitedVoterIds.every((voterId) => votedPairs.has(`${matchupId}:${voterId}`)));
}
