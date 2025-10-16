import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BACKEND_CONFIG, getBackendUrl, getBackendHeaders } from '@/lib/config';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tokenRes = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.GENERATE_TOKEN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const tokenData = await tokenRes.json().catch(() => ({} as any));
    const token = tokenData?.data?.token || tokenData?.token || tokenData?.data?.data?.token;

    const headers = getBackendHeaders(token);

    const res = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.ORDERS.USER_BY_ID(id)), {
      method: 'GET',
      headers,
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to fetch user' }, { status: res.status });
    }

    const payload = data?.data ?? data;
    return NextResponse.json({ success: true, data: payload });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Backend expects PATCH to /orders/users/:id; reuse backendGet with fetch for PATCH
    const tokenRes = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.GENERATE_TOKEN), { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' } 
    });
    const tokenData = await tokenRes.json().catch(() => ({} as any));
    const token = tokenData?.data?.token || tokenData?.token || tokenData?.data?.data?.token;

    const headers = getBackendHeaders(token);

    const res = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.ORDERS.USER_BY_ID(id)), {
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


