import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet, backendPost } from '@/lib/backend-client';

function getBackendMessage(data: unknown, fallback: string): string {
  const payload = (data || {}) as Record<string, unknown>;
  return (
    (typeof payload.message === 'string' && payload.message) ||
    (typeof payload.error === 'string' && payload.error) ||
    (typeof payload.details === 'string' && payload.details) ||
    fallback
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get('search') || undefined;
    const { ok, data, status } = await backendGet('/visa_pricing', { search }, session.user?.email || undefined);

    if (!ok) {
      return NextResponse.json(
        { error: getBackendMessage(data, 'Failed to fetch visa pricing records') },
        { status: status || 502 }
      );
    }

    const results = data?.data?.results ?? [];
    const recordsCount = data?.data?.recordsCount ?? (Array.isArray(results) ? results.length : 0);

    return NextResponse.json({
      success: true,
      data: { results, recordsCount },
      message: data?.message,
    });
  } catch (error) {
    console.error('Error fetching visa pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ok, data, status } = await backendPost('/visa_pricing', body, session.user?.email || undefined);

    if (!ok || data?.status === 'ERROR') {
      return NextResponse.json(
        { error: getBackendMessage(data, 'Failed to create visa pricing record') },
        { status: status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data?.results ?? data?.data ?? data,
      message: data?.message,
    });
  } catch (error) {
    console.error('Error creating visa pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
