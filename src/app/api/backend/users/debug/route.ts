import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ok, data, status } = await backendGet('/orders/users/debug', {}, session.user?.email || undefined);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to fetch users debug' }, { status: status || 502 });
    }
    return NextResponse.json({ success: true, data: (data?.data ?? data) });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch users debug' }, { status: 500 });
  }
}


