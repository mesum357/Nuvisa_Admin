-- Align shared `faqs` table with nuvisa-admin Prisma schema (production uses isFeatured + faqType)
ALTER TABLE "faqs"
  ADD COLUMN IF NOT EXISTS "faqTypeCreatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT true;

-- Backfill tab name + timestamps from existing rows
UPDATE "faqs"
SET "faqType" = "category"
WHERE ("faqType" IS NULL OR TRIM("faqType") = '')
  AND "category" IS NOT NULL
  AND TRIM("category") <> '';

UPDATE "faqs"
SET "category" = "faqType"
WHERE ("category" IS NULL OR TRIM("category") = '')
  AND "faqType" IS NOT NULL
  AND TRIM("faqType") <> '';

UPDATE "faqs"
SET "faqTypeCreatedAt" = "createdAt"
WHERE "faqTypeCreatedAt" IS NULL;

-- If legacy snake_case column exists from an old deploy, copy into isFeatured
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'faqs' AND column_name = 'is_featured'
  ) THEN
    EXECUTE 'UPDATE "faqs" SET "isFeatured" = COALESCE("is_featured", "isFeatured", true) WHERE "isFeatured" IS NULL';
  END IF;
END $$;
