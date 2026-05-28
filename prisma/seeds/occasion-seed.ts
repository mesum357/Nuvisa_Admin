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

export async function seedOccasionContent() {
  const payload = {
    title: 'Save and bring your plans to life',
    description: 'Lock it in today to maximise savings.',
    occasions: PRODUCTION_OCCASIONS,
    isActive: true,
  };

  const existing = await prisma.occasionContent.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  if (existing) {
    await prisma.occasionContent.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.occasionContent.create({ data: payload });
  }

  console.log('Occasion content seeded successfully');
}
