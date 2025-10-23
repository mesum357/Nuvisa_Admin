import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const comparisonSeedData = {
  title: "Travel Agency",
  leftSideTitle: "Traditional Agency",
  rightSideTitle: "NUvisa",
  leftSideImage: "/image/visa-agency.png",
  rightSideImage: "/image/nuvisa-image.jpg",
  leftSideItems: [
    "£250-£300 + extra fees",
    "Traditional, often heavy-paperwork",
    "Appointment in 6-8 weeks",
    "Application business hours only",
    "In-person or lengthy phone appointments",
  ],
  rightSideItems: [
    "Flat £200 - no hidden fees",
    "AI powered seamless process",
    "Appointment in 10 days or less",
    "24/7 instant submission & tracking",
    "Complete digital experience",
  ],
  isActive: true,
};

export async function seedComparisonSection() {
  try {
    // Check if comparison section already exists
    const existingComparison = await prisma.comparisonSection.findFirst();
    
    if (existingComparison) {
      console.log('Comparison section already exists, updating with fresh data...');
      
      // Update the existing comparison section
      const updatedComparison = await prisma.comparisonSection.update({
        where: { id: existingComparison.id },
        data: comparisonSeedData,
      });

      console.log('Comparison section updated successfully:', updatedComparison.id);
      return updatedComparison;
    }

    // Create the comparison section
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

// Run the seed if this file is executed directly
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
