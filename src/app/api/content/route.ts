import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePublicSite } from '@/lib/revalidate-public-site';
import { syncDailySlotsDefault } from '@/lib/daily-slots-site-content';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (key) {
      const content = await prisma.siteContent.findUnique({
        where: { key },
      });

      return NextResponse.json({
        success: true,
        data: content,
      });
    }

    const contents = await prisma.siteContent.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: contents,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { key, value, type } = data;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const content = await prisma.siteContent.upsert({
      where: { key },
      update: {
        value,
        type: type || 'text',
        updatedBy: (session.user as any).id,
      },
      create: {
        key,
        value,
        type: type || 'text',
        updatedBy: (session.user as any).id,
      },
    });

    if (key === 'daily_slots_state' && value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed?.defaultSpots != null) {
          await syncDailySlotsDefault(parsed.defaultSpots);
        }
      } catch {
        // ignore malformed daily_slots_state JSON
      }
    }

    await revalidatePublicSite(['content', 'homepage']);

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { key, value } = data;

    const content = await prisma.siteContent.upsert({
      where: { key },
      update: {
        value,
        updatedBy: (session.user as any).id,
      },
      create: {
        key,
        value,
        type: 'text',
        updatedBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

