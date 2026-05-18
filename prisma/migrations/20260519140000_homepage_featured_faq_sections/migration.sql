-- Homepage shows up to 3 section tabs from FAQs with isFeatured = true
UPDATE "faqs"
SET "isFeatured" = true
WHERE "isActive" = true
  AND (
    "category" IN (
      'General information',
      'Eligibility & requirements',
      'The application process'
    )
    OR "faqType" IN (
      'General information',
      'Eligibility & requirements',
      'The application process'
    )
  );
