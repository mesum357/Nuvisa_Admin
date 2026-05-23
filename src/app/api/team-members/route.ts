import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const be = await backendGet(
      '/orders/team-members',
      undefined,
      (session.user as { email?: string })?.email
    );

    if (!be.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team members' },
        { status: be.status || 500 }
      );
    }

    const payload = be.data?.data?.results ?? be.data?.data ?? be.data?.results ?? be.data;
    const members = Array.isArray(payload)
      ? payload
      : payload?.members || [];

    return NextResponse.json({ success: true, data: members });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch team members', details: message },
      { status: 500 }
    );
  }
}
