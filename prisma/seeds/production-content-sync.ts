/**
 * Sync staging CMS to match production nuvisa.co.uk visible copy.
 * Safe to re-run: upserts keys and replaces occasion/FAQ collections.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCTION_OCCASIONS = [
  {
    title: 'February Half Term 2026 – 15/02 to 23/02',
    subTitle: 'School break travel',
    img: '/image/occ1.jpeg',
    textColor: '#ffffff',
    bgColor: '#5f9aff',
    startDate: '2026-02-15',
    endDate: '2026-02-23',
  },
  {
    title: 'Easter Break 2026 – 29/03 to 12/04',
    subTitle: 'Spring getaway',
    img: '/image/occ2.jpeg',
    textColor: '#ffffff',
    bgColor: '#ff8e59',
    startDate: '2026-03-29',
    endDate: '2026-04-12',
  },
  {
    title: 'Summer Holidays 2026 – 18/07 to 31/08',
    subTitle: 'Peak season deals',
    img: '/image/occ3.jpeg',
    textColor: '#1a1a1a',
    bgColor: '#daee69',
    startDate: '2026-07-18',
    endDate: '2026-08-31',
  },
  {
    title: 'October Half Term 2026 – 17/10 to 01/11',
    subTitle: 'Autumn escape',
    img: '/image/occ4.jpeg',
    textColor: '#1a1a1a',
    bgColor: '#fdfd55',
    startDate: '2026-10-17',
    endDate: '2026-11-01',
  },
  {
    title: 'New Occasion',
    subTitle: 'SUBTITLE HERE',
    img: '/image/occ5.jpeg',
    textColor: '#eeffaa',
    bgColor: '#442266',
    startDate: '',
    endDate: '',
  },
  {
    title: 'New year',
    subTitle: 'SUBTITLE HERE',
    img: '/image/occ6.jpeg',
    textColor: '#ffffff',
    bgColor: '#ffffff',
    startDate: '',
    endDate: '',
  },
];

const HEADER_UPDATES: Array<{
  key: string;
  value: string;
  type: string;
  section: string;
  order: number;
}> = [
  {
    key: 'banner_offer_text',
    value: 'Faster processing, Dedicated support, Honestly priced',
    type: 'text',
    section: 'banner',
    order: 1,
  },
  {
    key: 'banner_button_text',
    value: 'Get now',
    type: 'text',
    section: 'banner',
    order: 2,
  },
  {
    key: 'banner_button_link',
    value: '/get-the-visa',
    type: 'url',
    section: 'banner',
    order: 3,
  },
  {
    key: 'nav_tagline',
    value: 'Schengen visa service for Indian residents in the UK',
    type: 'text',
    section: 'navigation',
    order: 1,
  },
  {
    key: 'contact_phone',
    value: '+44 7388120901',
    type: 'phone',
    section: 'contact',
    order: 1,
  },
  {
    key: 'contact_email',
    value: 'support@nuvisa.co.uk',
    type: 'email',
    section: 'contact',
    order: 2,
  },
];

const FOOTER_UPDATES = [
  {
    key: 'company_copyright',
    value: 'Copyright © 2026 Nuvisa. - All Rights Reserved.',
    type: 'text',
    section: 'company_info',
    order: 1,
  },
  {
    key: 'company_description',
    value:
      'NUvisa is an independent company registered in England and Wales that offers efficient and professional assistance in obtaining visas and other travel products online fast. The company and site are not associated with any governmental agency. Companies house no: 13081681 | VAT registration no: 412344437 | D-U-N-S no: 227538057. | ICO registration no: ZB732764. Registered Office: 2 Brunel Way, The Future Works, Slough, Greater London, England, SL1 1FQ | support@nuvisa.co.uk | +44 7388120901',
    type: 'text',
    section: 'company_info',
    order: 2,
  },
];

const HERO_UPDATES = [
  {
    key: 'hero_title',
    value: "Don't Postpone Your Happines!",
    type: 'text',
    section: 'title',
    order: 1,
  },
  {
    key: 'hero_description',
    value: 'Everyday Steals I £90 Germany I Our Guarantee+Link+/our-guarantee',
    type: 'text',
    section: 'description',
    order: 2,
  },
  {
    key: 'hero_cta_text',
    value: 'Get the Visa',
    type: 'text',
    section: 'cta',
    order: 3,
  },
  {
    key: 'hero_cta_link',
    value: '/get-the-visa',
    type: 'url',
    section: 'cta',
    order: 4,
  },
  {
    key: 'hero_discount_ticket_text',
    value: 'Students! Get 10% Off',
    type: 'text',
    section: 'cta',
    order: 5,
  },
  {
    key: 'hero_discount_ticket_link',
    value: '/get-the-visa',
    type: 'url',
    section: 'cta',
    order: 5,
  },
];

const PROCESS_UPDATES = [
  {
    key: 'process_heading',
    value: "We're process driven\nBuckle up",
    type: 'text',
    section: 'heading',
    order: 1,
  },
  {
    key: 'process_description',
    value:
      'Benefit from document pre-checks, error-proof form filling, and personalized visa guidance, powered by AI with human oversight at critical checkpoints - all designed to prevent delays, mistakes, and rejections.',
    type: 'text',
    section: 'description',
    order: 2,
  },
  {
    key: 'step1_title',
    value: 'Checkout',
    type: 'text',
    section: 'step_title',
    order: 3,
  },
  {
    key: 'step1_description',
    value:
      'Confirm the required documents and checkout to lay the foundation. Upload documents securely and complete your details as per your travel history, financial status & occupation.',
    type: 'text',
    section: 'step_description',
    order: 4,
  },
  {
    key: 'step2_title',
    value: 'Build',
    type: 'text',
    section: 'step_title',
    order: 5,
  },
  {
    key: 'step2_description',
    value:
      'Experienced professionals who know exactly what is needed and how to get it done right - review and create a complete application, allowing our customers to benefit from 99.3% approval rate.',
    type: 'text',
    section: 'step_description',
    order: 6,
  },
  {
    key: 'step3_title',
    value: 'Submit',
    type: 'text',
    section: 'step_title',
    order: 7,
  },
  {
    key: 'step3_description',
    value:
      'NUvisa books your appointment. Submit all gathered documents & provide biometrics details at your appointment. We will be with you every step of the way, providing ongoing support to maximise your success.',
    type: 'text',
    section: 'step_description',
    order: 8,
  },
  {
    key: 'step4_title',
    value: 'Approved',
    type: 'text',
    section: 'step_title',
    order: 9,
  },
  {
    key: 'step4_description',
    value:
      'Your Schengen visa will be processed within 5–15 working days, and your passport complete with the Schengen tourist visa stamp will be delivered directly to your doorstep.',
    type: 'text',
    section: 'step_description',
    order: 10,
  },
];

const KLARNA_UPDATES = [
  {
    key: 'klarna_heading',
    value: 'Pay in small instalments with interest free financing!',
    type: 'text',
    section: 'heading',
    order: 1,
  },
  {
    key: 'klarna_subtitle',
    value: 'Pay in 3 payments at 0% interest',
    type: 'text',
    section: 'subtitle',
    order: 2,
  },
  {
    key: 'klarna_payment_amount',
    value: '',
    type: 'currency',
    section: 'details',
    order: 3,
  },
  {
    key: 'klarna_interest_rate',
    value: '',
    type: 'text',
    section: 'details',
    order: 4,
  },
  {
    key: 'klarna_fees',
    value: 'No fees',
    type: 'text',
    section: 'details',
    order: 5,
  },
];

const SITE_CONTENT_UPDATES: Array<{ key: string; value: string }> = [
  {
    key: 'ocassion_title',
    value: 'Save and bring your plans to life',
  },
  {
    key: 'ocassion_subtitle',
    value: 'Lock it in today to maximise savings.',
  },
  {
    key: 'visasolution_title',
    value: 'Everyday Steals',
  },
  {
    key: 'visasolution_subtitle',
    value:
      'A curated edit of handpicked countries for travellers who are on budget and want to access Schengen countries.',
  },
  {
    key: 'price_match_title',
    value: 'The NUvisa Price Match Promise',
  },
];

async function upsertKeyedRows<T extends { key: string; value: string }>(
  label: string,
  rows: T[],
  upsertFn: (row: T) => Promise<unknown>,
) {
  for (const row of rows) {
    await upsertFn(row);
  }
  console.log(`✓ ${label}: ${rows.length} keys synced`);
}

async function syncHeaderContent() {
  await upsertKeyedRows('header', HEADER_UPDATES, (row) =>
    prisma.headerContent.upsert({
      where: { key: row.key },
      update: {
        value: row.value,
        type: row.type,
        section: row.section,
        order: row.order,
        isActive: true,
      },
      create: { ...row, isActive: true },
    }),
  );
}

async function syncFooterContent() {
  await upsertKeyedRows('footer', FOOTER_UPDATES, (row) =>
    prisma.footerContent.upsert({
      where: { key: row.key },
      update: {
        value: row.value,
        type: row.type,
        section: row.section,
        order: row.order,
        isActive: true,
      },
      create: { ...row, isActive: true },
    }),
  );
}

async function syncHeroContent() {
  await upsertKeyedRows('hero', HERO_UPDATES, (row) =>
    prisma.heroContent.upsert({
      where: { key: row.key },
      update: {
        value: row.value,
        type: row.type,
        section: row.section,
        order: row.order,
        isActive: true,
      },
      create: { ...row, isActive: true },
    }),
  );
}

async function syncProcessContent() {
  await upsertKeyedRows('process', PROCESS_UPDATES, (row) =>
    prisma.processContent.upsert({
      where: { key: row.key },
      update: {
        value: row.value,
        type: row.type,
        section: row.section,
        order: row.order,
        isActive: true,
      },
      create: { ...row, isActive: true },
    }),
  );
}

async function syncKlarnaContent() {
  await upsertKeyedRows('klarna', KLARNA_UPDATES, (row) =>
    prisma.klarnaContent.upsert({
      where: { key: row.key },
      update: {
        value: row.value,
        type: row.type,
        section: row.section,
        order: row.order,
        isActive: true,
      },
      create: { ...row, isActive: true },
    }),
  );
}

async function syncSiteContent() {
  for (const row of SITE_CONTENT_UPDATES) {
    await prisma.siteContent.upsert({
      where: { key: row.key },
      update: { value: row.value },
      create: { key: row.key, value: row.value, type: 'text' },
    });
  }
  console.log(`✓ site_content: ${SITE_CONTENT_UPDATES.length} keys synced`);
}

async function syncOccasionContent() {
  const existing = await prisma.occasionContent.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  const payload = {
    title: 'Save and bring your plans to life',
    description: 'Lock it in today to maximise savings.',
    occasions: PRODUCTION_OCCASIONS,
    isActive: true,
  };

  if (existing) {
    await prisma.occasionContent.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.occasionContent.create({ data: payload });
  }
  console.log('✓ occasion_content synced');
}

function normalizeFaqType(raw: unknown) {
  const value = String(raw || 'General information').trim();
  return value || 'General information';
}

async function syncFaqsFromProduction() {
  const res = await fetch('https://nuvisa.co.uk/api/public/faqs');
  if (!res.ok) {
    throw new Error(`Failed to fetch production FAQs: ${res.status}`);
  }
  const json = (await res.json()) as {
    success?: boolean;
    data?: Array<Record<string, unknown>>;
  };
  const rows = Array.isArray(json?.data) ? json.data : [];
  if (!rows.length) {
    throw new Error('Production FAQ list was empty');
  }

  await prisma.fAQ.deleteMany({});
  for (const [index, row] of rows.entries()) {
    await prisma.fAQ.create({
      data: {
        question: String(row.question || ''),
        answer: String(row.answer || ''),
        category: String(row.category || row.faqType || 'General information'),
        faqType: normalizeFaqType(row.faqType || row.category),
        faqTypeId: row.faqTypeId ? String(row.faqTypeId) : null,
        faqTypeCreatedAt: row.faqTypeCreatedAt
          ? new Date(String(row.faqTypeCreatedAt))
          : null,
        order: Number(row.order ?? index + 1),
        isActive: row.isActive !== false,
        isFeatured: Boolean(row.isFeatured ?? row.is_featured),
      },
    });
  }
  console.log(`✓ FAQs synced from production (${rows.length} items)`);
}

export async function syncProductionContent() {
  console.log('Syncing staging CMS to production nuvisa.co.uk copy…');
  await syncHeaderContent();
  await syncFooterContent();
  await syncHeroContent();
  await syncProcessContent();
  await syncKlarnaContent();
  await syncSiteContent();
  await syncOccasionContent();
  await syncFaqsFromProduction();
  console.log('Production content sync complete.');
}

if (require.main === module) {
  syncProductionContent()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
