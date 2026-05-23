-- CreateTable
CREATE TABLE IF NOT EXISTS "visa_country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "price_from" TEXT DEFAULT 'From',

    CONSTRAINT "visa_country_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "visa_country_name_key" ON "visa_country"("name");
