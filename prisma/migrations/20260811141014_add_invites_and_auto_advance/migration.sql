-- AlterTable
ALTER TABLE "Bracket" ADD COLUMN "autoAdvance" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Voter" ADD COLUMN "email" TEXT,
ADD COLUMN "inviteToken" TEXT,
ADD COLUMN "invitedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Voter_inviteToken_key" ON "Voter"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "Voter_bracketId_email_key" ON "Voter"("bracketId", "email");
