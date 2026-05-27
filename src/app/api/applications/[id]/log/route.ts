import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const be = await backendGet(
      `/orders/application/${id}/activity`,
      undefined,
      (session.user as { email?: string })?.email
    );

    if (!be.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activity log' },
        { status: be.status || 500 }
      );
    }

    const activities =
      be.data?.data?.results?.activities ||
      be.data?.data?.activities ||
      be.data?.results?.activities ||
      [];

    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch activity log', details: error?.message },
      { status: 500 }
    );
  }
}
