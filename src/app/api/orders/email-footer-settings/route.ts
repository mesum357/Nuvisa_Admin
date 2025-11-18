import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet, backendPatch } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ok, data, status } = await backendGet('/orders/email-footer-settings');

    if (!ok) {
      return NextResponse.json({ error: 'Failed to fetch email footer settings' }, { status: status || 502 });
    }

    // Unwrap backend response envelope
    const envelope = (data ?? {}) as any;
    const settings = envelope?.data ?? envelope;

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching email footer settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { ok, data, status } = await backendPatch('/orders/email-footer-settings', body);

    if (!ok) {
      return NextResponse.json({ error: 'Failed to update email footer settings' }, { status: status || 502 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating email footer settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

