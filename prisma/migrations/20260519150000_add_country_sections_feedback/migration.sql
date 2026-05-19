-- CreateTable "country_sections"
CREATE TABLE IF NOT EXISTS "public"."country_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Choose Your Country',
    "description" TEXT NOT NULL DEFAULT 'We support 20 countries over all the visa centres in the UK',
    "countries" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "countryName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "country_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable "feedback_submissions"
CREATE TABLE IF NOT EXISTS "public"."feedback_submissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_submissions_pkey" PRIMARY KEY ("id")
);
