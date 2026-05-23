import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendPatch } from '@/lib/backend-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const be = await backendPatch(
      `/orders/application/${id}/assign`,
      body,
      (session.user as { email?: string })?.email
    );

    if (!be.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign application', details: be.data },
        { status: be.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: be.data?.data || be.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to assign application', details: error?.message },
      { status: 500 }
    );
  }
}
