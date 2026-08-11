// A Voter's displayed name/avatar comes from its linked Person when one
// exists (persistent, cross-bracket identity) and falls back to the voter's
// own per-bracket fields otherwise (ephemeral self-join with no email).

export function effectiveVoterName(voter: { name: string; person?: { name: string } | null }): string {
  return voter.person?.name ?? voter.name;
}

export function effectiveVoterAvatar(voter: {
  avatar: string | null;
  person?: { avatar: string | null } | null;
}): string | null {
  return voter.person?.avatar ?? voter.avatar;
}
