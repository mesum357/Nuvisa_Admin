import { PrismaClient } from '@prisma/client';

const DEFAULT_VISA_COUNTRIES = [
  { name: 'Germany', image: '/image/country/Germany.jpg' },
  { name: 'Netherlands', image: '/image/country/Netherlands.jpg' },
  { name: 'Belgium', image: '/image/country/Belgium.jpg' },
  { name: 'France', image: '/image/country/France.jpg' },
  { name: 'Italy', image: '/image/country/Italy.jpg' },
  { name: 'Bulgaria', image: '/image/country/Bulgaria.jpg' },
  { name: 'Estonia', image: '/image/country/Estonia.jpg' },
  { name: 'Hungary', image: '/image/country/Hungary.jpg' },
  { name: 'Portugal', image: '/image/country/Portugal.jpg' },
  { name: 'Iceland', image: '/image/country/Iceland.jpg' },
  { name: 'Poland', image: '/image/country/Poland.jpg' },
  { name: 'Norway', image: '/image/country/Norway.jpg' },
  { name: 'Switzerland', image: '/image/country/Switzerland.jpg' },
  { name: 'Spain', image: '/image/country/Spain.jpg' },
  { name: 'Malta', image: '/image/country/Malta.jpg' },
  { name: 'Luxembourg', image: '/image/country/Luxembourg.jpg' },
  { name: 'Greece', image: '/image/country/Greece.jpg' },
  { name: 'Finland', image: '/image/country/Finland.jpg' },
];

export async function seedVisaCountries(prisma: PrismaClient) {
  for (const country of DEFAULT_VISA_COUNTRIES) {
    await prisma.visaCountry.upsert({
      where: { name: country.name },
      update: {
        image: country.image,
        isActive: true,
      },
      create: {
        name: country.name,
        image: country.image,
        isActive: true,
        price_from: 'From',
      },
    });
  }

  console.log(`Seeded ${DEFAULT_VISA_COUNTRIES.length} visa countries`);
}
