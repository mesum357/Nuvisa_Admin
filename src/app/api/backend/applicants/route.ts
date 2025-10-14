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

    const { ok, data, status } = await backendGet('/orders/applicants', {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    }, session.user?.email || undefined);

    if (!ok) {
      return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: status || 502 });
    }

    // Normalize backend response and map to PaginatedResponse<User>
    const payload = (data?.data ?? data) as any;
    const rows = Array.isArray(payload?.users) ? payload.users : [];
    const users = rows.map((u: any) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.user_name || u.email,
      email: u.email,
      phone: u.phone_no || '',
      status: 'ACTIVE',
      isVerified: false,
      emailVerified: false,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      // Optionally attach applications count for UI/export usage
      _count: { applications: Number(u.applications || 0) }
    }));

    const pagination = payload?.pagination || { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 };

    return NextResponse.json({
      success: true,
      data: {
        data: users,
        pagination,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 });
  }
}


