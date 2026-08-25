-- AlterTable
ALTER TABLE "Matchup" ADD COLUMN "forceCategoryVoting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Matchup" ADD COLUMN "tiebreakAttempt" INTEGER NOT NULL DEFAULT 0;
