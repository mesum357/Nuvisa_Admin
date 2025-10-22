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

    // Treat incoming id as either UUID or email
    const isEmail = id.includes('@');

    let res = isEmail
      ? new Response(null, { status: 404 }) // skip direct UUID endpoint if it's clearly an email
      : await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.ORDERS.USER_BY_ID(id)), {
      method: 'GET',
      headers,
        });

    // If direct GET by id is not supported (404), fallback to users search and filter by id
    if (res.status === 404) {
      const searchUrl = new URL(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.ORDERS.USERS));
      searchUrl.searchParams.set('page', '1');
      searchUrl.searchParams.set('limit', '5');
      searchUrl.searchParams.set('search', id);

      res = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers,
      });
      let user: any = null;
      try {
        const srch = await res.json().catch(() => ({} as any));
        if (res.ok) {
          const envelope: any = srch;
          const inner: any = envelope?.data?.results ?? envelope?.results ?? envelope?.data?.data ?? envelope?.data ?? envelope;
          const rows: any[] = Array.isArray(inner?.users)
            ? inner.users
            : Array.isArray(inner?.data)
              ? inner.data
              : Array.isArray(inner)
                ? inner
                : [];
          user = rows.find((u: any) => u?.id === id || u?.user_id === id || u?.userId === id || u?.email === id) || rows[0] || null;
        }
      } catch {}

      if (!user) {
        // Try applicants as a fallback source even if users search failed
        const applicantsUrl = new URL(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.ORDERS.APPLICANTS));
        applicantsUrl.searchParams.set('page', '1');
        applicantsUrl.searchParams.set('limit', '10');
        applicantsUrl.searchParams.set('search', id);
        try {
          const ar = await fetch(applicantsUrl.toString(), { method: 'GET', headers });
          const aj = await ar.json().catch(() => ({} as any));
          if (ar.ok) {
            const aenv: any = aj?.data ?? aj;
            const ain: any = aenv?.results ?? aenv?.data ?? aenv;
            const arows: any[] = Array.isArray(ain?.users)
              ? ain.users
              : Array.isArray(ain?.data)
                ? ain.data
                : Array.isArray(ain)
                  ? ain
                  : [];
            user = arows.find((u: any) => u?.id === id || u?.user_id === id || u?.userId === id || u?.email === id) || arows[0] || null;
          }
        } catch {}
      }
      return NextResponse.json({ success: true, data: user });
    }

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to fetch user' }, { status: res.status });
    }

    const payload = data?.data?.data ?? data?.data ?? data;
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

    // Prevent accidentally updating admin users
    if ((session.user as any)?.id === id) {
      return NextResponse.json({ error: 'Cannot update your own admin account through user API' }, { status: 400 });
    }

    console.log('User update request:', { 
      adminId: (session.user as any)?.id, 
      targetUserId: id, 
      updateData: body,
      adminRole: (session.user as any)?.role 
    });

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


