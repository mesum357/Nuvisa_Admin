import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedHeroContent() {
  try {
    console.log('🌱 Seeding hero content...');

    // Hero title
    await prisma.heroContent.upsert({
      where: { key: 'hero_title' },
      update: {},
      create: {
        key: 'hero_title',
        value: "Don't Postpone Your Happiness!",
        type: 'text',
        section: 'title',
        isActive: true,
        order: 1,
      },
    });

    // Hero description
    await prisma.heroContent.upsert({
      where: { key: 'hero_description' },
      update: {},
      create: {
        key: 'hero_description',
        value: 'Flat £200 fee, faster processing, dedicated support',
        type: 'text',
        section: 'description',
        isActive: true,
        order: 2,
      },
    });

    // CTA button text
    await prisma.heroContent.upsert({
      where: { key: 'hero_cta_text' },
      update: {},
      create: {
        key: 'hero_cta_text',
        value: 'Get the Visa',
        type: 'text',
        section: 'cta',
        isActive: true,
        order: 3,
      },
    });

    // CTA button link
    await prisma.heroContent.upsert({
      where: { key: 'hero_cta_link' },
      update: {},
      create: {
        key: 'hero_cta_link',
        value: '/get-the-visa',
        type: 'url',
        section: 'cta',
        isActive: true,
        order: 4,
      },
    });

    console.log('✅ Hero content seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding hero content:', error);
    throw error;
  }
}

