export type CategoryScores = Record<string, number>;

export interface SeedInput {
  movieId: string;
  seed: number;
}

export interface GeneratedMatchup {
  roundNumber: number;
  position: number;
  movieAId: string | null;
  movieBId: string | null;
  isBye: boolean;
  nextPosition: number | null;
  nextSlot: "A" | "B" | null;
}

export interface GeneratedBracket {
  totalRounds: number;
  matchups: GeneratedMatchup[];
  autoResolvedByes: { position: number; roundNumber: number; winnerMovieId: string }[];
}

// Shape returned by GET /api/brackets/[slug]/state — the single source of
// truth polled by voter screens, the admin dashboard, and the TV view.
export interface BracketStateMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  overview: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  runtime: number | null;
  trailerKey: string | null;
  filmTitle: string | null;
  filmYear: number | null;
  nominatedByName: string | null;
  nominatedByAvatar: string | null;
  seed: number | null;
  seedVoteCount: number;
  seedVoteAverage: number | null;
}

export interface BracketStateMatchup {
  id: string;
  position: number;
  isBye: boolean;
  status: "PENDING" | "OPEN" | "CLOSED" | "NEEDS_MANUAL_TIEBREAK" | "RESOLVED";
  movieA: { id: string; title: string; posterUrl: string | null; seed: number | null; trailerKey: string | null } | null;
  movieB: { id: string; title: string; posterUrl: string | null; seed: number | null; trailerKey: string | null } | null;
  winnerMovieId: string | null;
  winnerTitle: string | null;
  resolutionMethod: "SCORE" | "TIEBREAK_CATEGORY" | "COIN_FLIP" | "REVOTE" | null;
  // Auto-reopen after a first tie leaves status at "OPEN" — it was already
  // open — so PhaseWatcher's status-only fingerprint can't see that
  // transition happen. Exposed so it can be fingerprinted too.
  forceCategoryVoting: boolean;
}

export interface BracketStateRound {
  roundNumber: number;
  status: "PENDING" | "VOTING_OPEN" | "VOTING_CLOSED" | "COMPLETE";
  closesAt: string | null;
  confirmedVoterIds: string[];
  matchups: BracketStateMatchup[];
}

export interface BracketStateDraft {
  turnOrder: string[];
  currentTurnIndex: number;
  currentVoterId: string | null;
  currentVoterName: string | null;
  nextVoterName: string | null;
  participantNames: string[];
  isComplete: boolean;
}

export interface BracketStateLeaderboardEntry {
  voterId: string;
  voterName: string;
  voterAvatar: string | null;
  points: number;
}

export interface BracketState {
  bracket: {
    id: string;
    slug: string;
    name: string;
    status: "SETUP" | "NOMINATING" | "SEEDING" | "ACTIVE" | "COMPLETE";
    nominationMode: "OPEN" | "DRAFT";
    contentType: "MOVIE" | "CHARACTER";
    characterName: string | null;
    nominationCapPerVoter: number | null;
    poolTargetSize: number | null;
    hasFilters: boolean;
    filterSummary: string | null;
    invitedVoterCount: number;
  };
  categories: { key: string; label: string; isTiebreaker: boolean }[];
  movies: BracketStateMovie[];
  voterNames: string[];
  draft: BracketStateDraft | null;
  leaderboard: BracketStateLeaderboardEntry[] | null;
  rounds: BracketStateRound[];
}
