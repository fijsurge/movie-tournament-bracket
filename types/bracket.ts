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
  nominatedByName: string | null;
  seed: number | null;
  seedVoteCount: number;
  seedVoteAverage: number | null;
}

export interface BracketStateMatchup {
  id: string;
  position: number;
  isBye: boolean;
  status: "PENDING" | "OPEN" | "CLOSED" | "NEEDS_MANUAL_TIEBREAK" | "RESOLVED";
  movieA: { id: string; title: string; posterUrl: string | null } | null;
  movieB: { id: string; title: string; posterUrl: string | null } | null;
  winnerMovieId: string | null;
  winnerTitle: string | null;
}

export interface BracketStateRound {
  roundNumber: number;
  status: "PENDING" | "VOTING_OPEN" | "VOTING_CLOSED" | "COMPLETE";
  matchups: BracketStateMatchup[];
}

export interface BracketStateDraft {
  turnOrder: string[];
  currentTurnIndex: number;
  currentVoterId: string | null;
  currentVoterName: string | null;
  participantNames: string[];
  isComplete: boolean;
}

export interface BracketState {
  bracket: {
    id: string;
    slug: string;
    name: string;
    status: "SETUP" | "NOMINATING" | "SEEDING" | "ACTIVE" | "COMPLETE";
    nominationMode: "OPEN" | "DRAFT";
    nominationCapPerVoter: number | null;
    poolTargetSize: number | null;
    hasFilters: boolean;
    filterSummary: string | null;
  };
  categories: { key: string; label: string; isTiebreaker: boolean }[];
  movies: BracketStateMovie[];
  voterNames: string[];
  draft: BracketStateDraft | null;
  rounds: BracketStateRound[];
}
