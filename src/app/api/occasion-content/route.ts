import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePublicSite } from '@/lib/revalidate-public-site';

const DEFAULT_OCCASIONS = [
  { title: "Best snow right now", subTitle: "LAST-MINUTE SKI HOLIDAYS", img: "/image/occ1.jpeg", textColor: "#2d3436" },
  { title: "April", subTitle: "APRIL SKI HOLIDAYS", img: "/image/occ2.jpeg", textColor: "#ccff00" },
  { title: "Easter", subTitle: "EASTER SKI HOLIDAYS", img: "/image/occ3.jpeg", textColor: "#5d3fd3" },
  { title: "Xmas 26", subTitle: "CHRISTMAS SKI HOLIDAYS", img: "/image/occ4.jpeg", textColor: "#ffffff" },
  { title: "New Year 26", subTitle: "NEW YEAR SKI HOLIDAYS", img: "/image/occ5.jpeg", textColor: "#00a8ff" },
  { title: "Half Term 27", subTitle: "HALF TERM SKI HOLIDAYS", img: "/image/occ6.jpeg", textColor: "#f1c40f" },
];

export async function GET() {
  try {
    const results: any[] = await prisma.$queryRaw`SELECT * FROM occasion_content LIMIT 1`;
    let content = results[0] || null;

    if (!content) {
        const id = crypto.randomUUID();
        const occasionsJson = JSON.stringify(DEFAULT_OCCASIONS);
        await prisma.$executeRaw`
          INSERT INTO occasion_content (id, title, description, occasions, "isActive", "createdAt", "updatedAt")
          VALUES (${id}, 'Everyday Steals', 'Best deals on flights and hotels', ${occasionsJson}::jsonb, true, NOW(), NOW())
        `;
        const newResults: any[] = await prisma.$queryRaw`SELECT * FROM occasion_content WHERE id = ${id}`;
        content = newResults[0];
    }

    // Ensure occasions is parsed if it came back as a string (sometimes raw query does this)
    if (typeof content.occasions === 'string') {
      content.occasions = JSON.parse(content.occasions);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: content.id,
        title: content.title,
        description: content.description,
        occasions: content.occasions,
        isActive: content.isActive
      } 
    });
  } catch (error: any) {
    console.error("Error fetching occasion content:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, occasions, isActive } = body;

    const results: any[] = await prisma.$queryRaw`SELECT * FROM occasion_content LIMIT 1`;
    let content = results[0] || null;

    if (content) {
        const occasionsJson = JSON.stringify(occasions || []);
        await prisma.$executeRaw`
          UPDATE occasion_content 
          SET title = ${title}, 
              description = ${description || ""}, 
              occasions = ${occasionsJson}::jsonb, 
              "isActive" = ${isActive !== undefined ? isActive : true},
              "updatedAt" = NOW()
          WHERE id = ${content.id}
        `;
    } else {
        const id = crypto.randomUUID();
        const occasionsJson = JSON.stringify(occasions || []);
        await prisma.$executeRaw`
          INSERT INTO occasion_content (id, title, description, occasions, "isActive", "createdAt", "updatedAt")
          VALUES (${id}, ${title}, ${description || ""}, ${occasionsJson}::jsonb, ${isActive !== undefined ? isActive : true}, NOW(), NOW())
        `;
    }

    // Fetch the updated version to return
    const finalResults: any[] = await prisma.$queryRaw`SELECT * FROM occasion_content LIMIT 1`;
    const finalContent = finalResults[0];
    if (typeof finalContent.occasions === 'string') {
      finalContent.occasions = JSON.parse(finalContent.occasions);
    }

    await revalidatePublicSite(['content', 'homepage', 'occasion']);

    return NextResponse.json({ success: true, data: finalContent });
  } catch (error: any) {
    console.error("Error updating occasion content:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
