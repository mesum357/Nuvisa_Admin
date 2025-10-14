import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'DESC') as 'ASC' | 'DESC';

    const { ok, data, status } = await backendGet('/orders/users', {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    }, session.user?.email || undefined);

    if (!ok) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: status || 502 });
    }

    // Unwrap common backend envelopes (GetObjectTemplateForAPIResponseGeneral)
    // Expected shapes:
    // { status, data: { results: {...}, recordsCount }, message }
    // or direct data: { users, pagination }
    const envelope = (data ?? {}) as any;
    const inner = (envelope?.data?.results ?? envelope?.results ?? envelope?.data ?? envelope) as any;

    // Determine rows list
    let rows: any[] = [];
    if (Array.isArray(inner?.users)) rows = inner.users;
    else if (Array.isArray(inner?.data?.users)) rows = inner.data.users;
    else if (Array.isArray(inner?.rows)) rows = inner.rows;
    else if (Array.isArray(inner?.data)) rows = inner.data;
    else if (Array.isArray(inner)) rows = inner;

    const users = rows.map((u: any) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.user_name || u.email,
      email: u.email,
      phone: u.phone_no || '',
      status: u.status || 'ACTIVE',
      isVerified: Boolean(u.is_verified),
      emailVerified: false,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      _count: { applications: Number(u.applications || 0) }
    }));

    // Build pagination
    let pagination = inner?.pagination || envelope?.data?.pagination || envelope?.pagination;
    // recordsCount support from backend envelope
    const recordsCount = envelope?.data?.recordsCount ?? inner?.recordsCount ?? envelope?.recordsCount;
    if (!pagination && typeof recordsCount === 'number') {
      const total = Number(recordsCount) || 0;
      pagination = { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit || 1)) };
    }
    // count support
    const count = inner?.count ?? envelope?.data?.count ?? envelope?.count;
    if (!pagination && typeof count === 'number') {
      const total = Number(payload.count) || 0;
      pagination = { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit || 1)) };
    }
    if (!pagination) {
      pagination = { page: Number(page), limit: Number(limit), total: users.length, totalPages: 1 };
    }

    return NextResponse.json({
      success: true,
      data: {
        data: users,
        pagination,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
