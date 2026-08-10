-- CreateTable
CREATE TABLE "Bracket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SETUP',
    "nominationMode" TEXT NOT NULL DEFAULT 'OPEN',
    "nominationCapPerVoter" INTEGER,
    "poolTargetSize" INTEGER,
    "currentRound" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isTiebreaker" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Category_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "nominatedByVoterId" TEXT,
    "seed" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movie_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Movie_nominatedByVoterId_fkey" FOREIGN KEY ("nominatedByVoterId") REFERENCES "Voter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DraftState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "turnOrder" TEXT NOT NULL,
    "currentTurnIndex" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DraftState_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Voter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Voter_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeedVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    CONSTRAINT "SeedVote_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeedVote_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeedVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Round_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Matchup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "movieAId" TEXT,
    "movieBId" TEXT,
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "winnerMovieId" TEXT,
    "resolutionMethod" TEXT,
    "nextMatchupId" TEXT,
    "nextMatchupSlot" TEXT,
    CONSTRAINT "Matchup_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Matchup_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Matchup_movieAId_fkey" FOREIGN KEY ("movieAId") REFERENCES "Movie" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Matchup_movieBId_fkey" FOREIGN KEY ("movieBId") REFERENCES "Movie" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Matchup_winnerMovieId_fkey" FOREIGN KEY ("winnerMovieId") REFERENCES "Movie" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Matchup_nextMatchupId_fkey" FOREIGN KEY ("nextMatchupId") REFERENCES "Matchup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchupId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "scoresMovieA" TEXT NOT NULL,
    "scoresMovieB" TEXT NOT NULL,
    "totalA" INTEGER NOT NULL,
    "totalB" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "Matchup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Bracket_slug_key" ON "Bracket"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_bracketId_key_key" ON "Category"("bracketId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_bracketId_tmdbId_key" ON "Movie"("bracketId", "tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftState_bracketId_key" ON "DraftState"("bracketId");

-- CreateIndex
CREATE UNIQUE INDEX "Voter_bracketId_normalizedName_key" ON "Voter"("bracketId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "SeedVote_movieId_voterId_key" ON "SeedVote"("movieId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_bracketId_roundNumber_key" ON "Round"("bracketId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Matchup_bracketId_roundId_position_key" ON "Matchup"("bracketId", "roundId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_matchupId_voterId_key" ON "Vote"("matchupId", "voterId");
