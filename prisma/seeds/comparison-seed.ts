import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const comparisonSeedData = {
  title: 'Transparency builds trust',
  tooltip: 'Competitor information gathered in April 2026 pricing is subject to change.',
  leftSideTitle: 'Traditional Agency',
  rightSideTitle: 'NUvisa',
  leftSideImage: '/image/visa-agency.png',
  rightSideImage: '/image/nuvisa-image.jpg',
  leftSideItems: [
    '£250–£300 + extra fees',
    'Traditional, often heavy-paperwork',
    'Appointment in 6–8 weeks',
    'Application business hours only',
    'In-person or lengthy phone appointments',
  ],
  rightSideItems: [
    'Flat £200 - no hidden fees',
    'AI powered seamless process',
    'Appointment in 10 days or less',
    '24/7 instant submission & tracking',
    'Complete digital experience',
  ],
  detailSections: [
    {
      title: 'care & professionalism',
      items: [
        'Appointments with us are 2x faster than the industry average',
        'Real-time status tracking from anywhere',
        'Full itinerary included — flight reservations, hotel bookings, and cover letters, all in one place',
        'We prepare and verify every document so nothing gets rejected at the embassy',
        'Fast turnaround — we aim to review every application within 3 working hours',
      ],
    },
  ],
  experienceType: 'TASKS',
  experienceTitle: 'Take a closer look',
  experienceItems: [
    'A criminal history may disqualifies you from obtaining a visa',
    'Previous overstays or visa breaches can impact your application',
    'A passport valid for less than 3 months after Schengen trip may affect your visa eligibility',
    'Valid and adequate travel insurance is mandatory. You can add it to your order or provide your existing policy',
  ],
  comparisonColumns: ['NUVIsa', 'IVISA', "SCOTT'S", 'CIBT'],
  comparisonRows: [
    {
      feature: 'Price',
      values: ['£110', '£295', '£395', '£475'],
    },
    {
      feature: 'Savings',
      values: ['—', '+63%', '+72%', '+77%'],
    },
    {
      feature: 'Average appointment time',
      values: ['10 days or less', '4-6 weeks', '4-6 weeks', '3-4 weeks'],
    },
    {
      feature: 'Urgent appointment help',
      values: ['check', 'x', 'x', 'x'],
    },
  ],
  countryName: 'Default',
  isActive: true,
};

export async function seedComparisonSection() {
  try {
    const existingDefault = await prisma.comparisonSection.findFirst({
      where: { countryName: 'Default' },
    });

    if (existingDefault) {
      const updatedComparison = await prisma.comparisonSection.update({
        where: { id: existingDefault.id },
        data: comparisonSeedData,
      });

      console.log('Comparison section (Default) updated successfully:', updatedComparison.id);
      return updatedComparison;
    }

    const existingAny = await prisma.comparisonSection.findFirst();

    if (existingAny) {
      const updatedComparison = await prisma.comparisonSection.update({
        where: { id: existingAny.id },
        data: comparisonSeedData,
      });

      console.log('Comparison section updated successfully:', updatedComparison.id);
      return updatedComparison;
    }

    const comparison = await prisma.comparisonSection.create({
      data: comparisonSeedData,
    });

    console.log('Comparison section seeded successfully:', comparison.id);
    return comparison;
  } catch (error) {
    console.error('Error seeding comparison section:', error);
    throw error;
  }
}

if (require.main === module) {
  seedComparisonSection()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
