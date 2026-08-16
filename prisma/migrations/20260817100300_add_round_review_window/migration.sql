-- AlterTable
ALTER TABLE "Round" ADD COLUMN "closesAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RoundConfirmation" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoundConfirmation_roundId_voterId_key" ON "RoundConfirmation"("roundId", "voterId");

-- AddForeignKey
ALTER TABLE "RoundConfirmation" ADD CONSTRAINT "RoundConfirmation_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundConfirmation" ADD CONSTRAINT "RoundConfirmation_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
