import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Backend expects PATCH to /orders/users/:id; reuse backendGet with fetch for PATCH
    const baseURL = process.env.BACKEND_API_URL || 'https://app.nuvisa.co.uk';
    const adminOrigin = process.env.ADMIN_PUBLIC_URL || 'http://localhost:3001';
    const tokenRes = await fetch(baseURL + '/auth/generate-token', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const tokenData = await tokenRes.json().catch(() => ({} as any));
    const token = tokenData?.data?.token || tokenData?.token || tokenData?.data?.data?.token;

    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Admin-Origin': adminOrigin, 'X-Admin-Proxy': '1' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseURL}/orders/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to update user' }, { status: res.status });
    }

    const payload = data?.data ?? data;
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}


