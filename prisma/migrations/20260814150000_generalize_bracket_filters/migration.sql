-- AlterTable
ALTER TABLE "Bracket" ADD COLUMN "filterPersonIds" TEXT,
ADD COLUMN "filterCompanyIds" TEXT,
ADD COLUMN "filterKeywordIds" TEXT,
ADD COLUMN "filterCollectionIds" TEXT;

-- Backfill: fold the old singular person filter into the new array shape
UPDATE "Bracket"
SET "filterPersonIds" = json_build_array(json_build_object('id', "filterPersonId", 'name', "filterPersonName"))::text
WHERE "filterPersonId" IS NOT NULL AND "filterPersonName" IS NOT NULL;

-- AlterTable
ALTER TABLE "Bracket" DROP COLUMN "filterPersonId",
DROP COLUMN "filterPersonName";
