-- CreateEnum
CREATE TYPE "AvatarPresetCategory" AS ENUM ('THEME', 'PALETTE', 'STYLE');

-- CreateTable
CREATE TABLE "CustomAvatarPreset" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "category" "AvatarPresetCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "promptFragment" TEXT NOT NULL,
    "emoji" TEXT,
    "swatch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomAvatarPreset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomAvatarPreset" ADD CONSTRAINT "CustomAvatarPreset_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
