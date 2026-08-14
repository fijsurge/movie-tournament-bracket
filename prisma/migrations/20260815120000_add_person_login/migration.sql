-- AlterTable
ALTER TABLE "Person" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "loginTokenHash" TEXT,
ADD COLUMN "loginTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Person_loginTokenHash_key" ON "Person"("loginTokenHash");
