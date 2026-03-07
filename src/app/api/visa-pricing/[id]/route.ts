import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendDelete, backendGet, backendPatch } from '@/lib/backend-client';

function getBackendMessage(data: unknown, fallback: string): string {
  const payload = (data || {}) as Record<string, unknown>;
  return (
    (typeof payload.message === 'string' && payload.message) ||
    (typeof payload.error === 'string' && payload.error) ||
    (typeof payload.details === 'string' && payload.details) ||
    fallback
  );
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const { ok, data, status } = await backendGet(`/visa_pricing/${encodeURIComponent(id)}`, undefined, session.user?.email || undefined);

    if (!ok) {
      return NextResponse.json(
        { error: getBackendMessage(data, 'Failed to fetch visa pricing record') },
        { status: status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data?.results ?? data?.data ?? data,
      message: data?.message,
    });
  } catch (error) {
    console.error('Error fetching visa pricing detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { ok, data, status } = await backendPatch(
      `/visa_pricing/${encodeURIComponent(id)}`,
      body,
      session.user?.email || undefined
    );

    if (!ok || data?.status === 'ERROR') {
      return NextResponse.json(
        { error: getBackendMessage(data, 'Failed to update visa pricing record') },
        { status: status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data?.results ?? data?.data ?? data,
      message: data?.message,
    });
  } catch (error) {
    console.error('Error updating visa pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const { ok, data, status } = await backendDelete(
      `/visa_pricing/${encodeURIComponent(id)}`,
      session.user?.email || undefined
    );

    if (!ok || data?.status === 'ERROR') {
      return NextResponse.json(
        { error: getBackendMessage(data, 'Failed to delete visa pricing record') },
        { status: status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data?.results ?? data?.data ?? data,
      message: data?.message,
    });
  } catch (error) {
    console.error('Error deleting visa pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
