import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force Next.js to not cache this API
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log(">>> [API POST] Request Hit");
  try {
    const body = await request.json();
    console.log(">>> [API POST] Data Received:", body);

    if (!body.phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Attempting to save to Supabase
    const submission = await prisma.userAccount.upsert({
      where: { phone: body.phone },
      update: {
        uk_status: body.uk_status || "",
        schengen_refused: body.schengen_refused || "",
        journey_purpose: body.journey_purpose || "",
        dynamicAnswers: body.dynamicAnswers || {},
      },
      create: {
        phone: body.phone,
        uk_status: body.uk_status || "",
        schengen_refused: body.schengen_refused || "",
        journey_purpose: body.journey_purpose || "",
        dynamicAnswers: body.dynamicAnswers || {},
      },
    });

    console.log(">>> [API POST] SUCCESS! Saved to DB ID:", submission.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Data saved to Supabase successfully', 
      data: submission 
    });

  } catch (error: any) {
    // Ye logs aapke VS Code terminal (Main Project) mein dikhenge
    console.error(">>> [API POST] DATABASE ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  console.log(">>> [API GET] Fetching data directly from DB...");
  try {
    const data = await prisma.userAccount.findMany({
      orderBy: { joined: 'desc' },
    });

    console.log(`>>> [API GET] Records found: ${data.length}`);
    
    return NextResponse.json(
      { success: true, data },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error: any) {
    console.error(">>> [API GET] FETCH ERROR:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}