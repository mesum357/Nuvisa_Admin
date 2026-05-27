import { NextRequest, NextResponse } from 'next/server';
import {
  decrementDailySlots,
  readDailySlotsState,
  syncDailySlotsDefault,
} from '@/lib/daily-slots-site-content';
import { revalidatePublicSite } from '@/lib/revalidate-public-site';

export async function GET() {
  try {
    const state = await readDailySlotsState();
    return NextResponse.json({ success: true, data: state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to read daily slots', details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret =
      request.headers.get('x-revalidate-secret') || body?.secret;
    const expected = process.env.REVALIDATE_SECRET || '';
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (body?.action === 'sync_default' && body?.defaultSpots != null) {
      await syncDailySlotsDefault(body.defaultSpots);
      await revalidatePublicSite(['expert', 'homepage']);
      const state = await readDailySlotsState();
      return NextResponse.json({ success: true, data: state });
    }

    const state = await decrementDailySlots();
    await revalidatePublicSite(['expert', 'homepage']);
    return NextResponse.json({ success: true, data: state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update daily slots', details: message },
      { status: 500 }
    );
  }
}
