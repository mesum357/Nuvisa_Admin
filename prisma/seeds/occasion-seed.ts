import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_OCCASIONS = [
  { title: "Best snow right now", subTitle: "LAST-MINUTE SKI HOLIDAYS", img: "/image/occ1.jpeg", textColor: "#2d3436" },
  { title: "April", subTitle: "APRIL SKI HOLIDAYS", img: "/image/occ2.jpeg", textColor: "#ccff00" },
  { title: "Easter", subTitle: "EASTER SKI HOLIDAYS", img: "/image/occ3.jpeg", textColor: "#5d3fd3" },
  { title: "Xmas 26", subTitle: "CHRISTMAS SKI HOLIDAYS", img: "/image/occ4.jpeg", textColor: "#ffffff" },
  { title: "New Year 26", subTitle: "NEW YEAR SKI HOLIDAYS", img: "/image/occ5.jpeg", textColor: "#00a8ff" },
  { title: "Half Term 27", subTitle: "HALF TERM SKI HOLIDAYS", img: "/image/occ6.jpeg", textColor: "#f1c40f" },
];

export async function seedOccasionContent() {
  const existing = await prisma.occasionContent.findFirst();
  
  if (!existing) {
    await prisma.occasionContent.create({
      data: {
        title: "Everyday Steals",
        description: "Best deals on flights and hotels",
        occasions: DEFAULT_OCCASIONS,
        isActive: true,
      },
    });
    console.log('Occasion content seeded successfully');
  }
}
