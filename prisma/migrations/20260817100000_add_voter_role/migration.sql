-- CreateEnum
CREATE TYPE "VoterRole" AS ENUM ('VOTER', 'ADMIN');

-- AlterTable
ALTER TABLE "Voter" ADD COLUMN "role" "VoterRole" NOT NULL DEFAULT 'VOTER';
