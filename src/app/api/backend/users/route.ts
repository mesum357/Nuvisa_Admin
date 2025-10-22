import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';

// Utility function to process user names from various backend field formats
function processUserName(user: any): string {
  // Try different combinations of name fields
  const firstName = user.first_name || user.firstName || user.given_name || '';
  const lastName = user.last_name || user.lastName || user.family_name || '';
  const fullName = user.full_name || user.fullName || user.name || '';
  const userName = user.user_name || user.userName || '';
  
  // Debug logging to see what fields are available
  console.log('Processing user name for:', user.email, 'Available fields:', {
    first_name: user.first_name,
    firstName: user.firstName,
    given_name: user.given_name,
    last_name: user.last_name,
    lastName: user.lastName,
    family_name: user.family_name,
    full_name: user.full_name,
    fullName: user.fullName,
    name: user.name,
    user_name: user.user_name,
    userName: user.userName
  });
  
  // Priority order: first+last name, full name, user name, email
  if (firstName || lastName) {
    const result = [firstName, lastName].filter(Boolean).join(' ').trim();
    console.log('Using first+last name:', result);
    return result;
  }
  if (fullName) {
    console.log('Using full name:', fullName.trim());
    return fullName.trim();
  }
  if (userName) {
    console.log('Using user name:', userName.trim());
    return userName.trim();
  }
  console.log('Using email as fallback:', user.email);
  return user.email || 'Unknown User';
}

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
      name: processUserName(u),
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
      const total = Number(count) || 0;
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
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
