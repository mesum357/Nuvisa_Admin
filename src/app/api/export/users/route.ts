import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { backendGet, backendPost } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let items: any[] = [];
    try {
      // Use the new backend export endpoint
      const exportResponse = await backendPost('/orders/export/users', {
        format: 'csv',
        search: search || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (exportResponse.ok && exportResponse.data?.data) {
        items = exportResponse.data.data;
      } else {
        // Fallback to users endpoint
        const be = await backendGet('/orders/users', {
          page: 1,
          limit: 1000,
          search: search || undefined,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          dateFrom: startDate || undefined,
          dateTo: endDate || undefined,
        });
        if (be.ok) {
          const env = (be.data as any) || {};
          const results = env?.data?.data ?? env?.data ?? env ?? {};
          items = Array.isArray(results) ? results : (results.users || results.items || results.rows || []);
        }
      }
    } catch (error) {
      console.error('Backend export failed, falling back to Prisma:', error);
    }

    // Fallback to Prisma if backend failed
    if (!Array.isArray(items) || items.length === 0) {
      const where: any = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const users = await prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      items = users.map((user) => ({
        'User ID': user.id,
        'Name': user.name,
        'Email': user.email,
        'Phone': user.phone || '',
        'Status': user.status,
        'Verified': user.isVerified ? 'Yes' : 'No',
        'Email Verified': user.emailVerified ? 'Yes' : 'No',
        'Applications Count': user._count.applications,
        'Created At': new Date(user.createdAt).toLocaleDateString(),
        'Updated At': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '',
      }));
    } else {
      // If we got data from backend, format it properly
      items = items.map((it: any) => ({
        'User ID': it['User ID'] || it.id,
        'Name': it['Name'] || it.name || '',
        'Email': it['Email'] || it.email || '',
        'Phone': it['Phone'] || it.phone || '',
        'Status': it['Status'] || it.status || '',
        'Verified': it['Verified'] || (it.isVerified ? 'Yes' : 'No'),
        'Email Verified': it['Email Verified'] || (it.emailVerified ? 'Yes' : 'No'),
        'Applications Count': it['Applications Count'] || it.applicationsCount || 0,
        'Created At': it['Created At'] || (it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ''),
        'Updated At': it['Updated At'] || (it.updatedAt ? new Date(it.updatedAt).toLocaleDateString() : ''),
      }));
    }

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Export users error:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}

