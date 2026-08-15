-- CreateEnum
CREATE TYPE "BracketContentType" AS ENUM ('MOVIE', 'CHARACTER');

-- AlterTable
ALTER TABLE "Bracket" ADD COLUMN "contentType" "BracketContentType" NOT NULL DEFAULT 'MOVIE';
ALTER TABLE "Bracket" ADD COLUMN "characterName" TEXT;

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN "filmTmdbId" INTEGER;
ALTER TABLE "Movie" ADD COLUMN "filmTitle" TEXT;
ALTER TABLE "Movie" ADD COLUMN "filmYear" INTEGER;
