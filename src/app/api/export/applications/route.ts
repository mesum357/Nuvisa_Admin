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

    // Try backend first to ensure we export what the list shows
    const mapStatus = (s?: string) => {
      if (!s) return undefined;
      const v = s.toUpperCase();
      if (v === 'PENDING') return 'new';
      if (v === 'UNDER_REVIEW') return 'under_review';
      if (v === 'APPROVED') return 'approved';
      if (v === 'REJECTED') return 'rejected';
      if (v === 'COMPLETED') return 'completed';
      return undefined;
    };

    let items: any[] = [];
    try {
      // Use the new backend export endpoint
      const exportResponse = await backendPost('/orders/export', {
        format: 'csv',
        status: mapStatus(status) || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (exportResponse.ok && exportResponse.data?.data) {
        items = exportResponse.data.data;
      } else {
        // Fallback to search endpoint
        const be = await backendGet('/orders/search', {
          page_no: 1,
          page_size: 1000,
          status: mapStatus(status) || undefined,
          q: search || undefined,
        });
        if (be.ok) {
          const env = (be.data as any) || {};
          const results = env?.data?.results ?? env?.results ?? env ?? {};
          items = Array.isArray(results) ? results : (results.applications || results.items || results.rows || []);
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
          { applicationNo: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      }
      if (startDate || endDate) {
        where.submittedAt = {};
        if (startDate) where.submittedAt.gte = new Date(startDate);
        if (endDate) where.submittedAt.lte = new Date(endDate);
      }
      const applications = await prisma.application.findMany({
        where,
        include: { user: { select: { name: true, email: true, phone: true } } },
        orderBy: { submittedAt: 'desc' },
      });
      items = applications.map((app) => ({
        'Application ID': app.id,
        'Order ID': app.applicationNo,
        'User Name': app.user?.name || '',
        'User Email': app.user?.email || '',
        'Phone': app.user?.phone || '',
        'Status': app.status,
        'Total Amount': Number(app.totalAmount || 0),
        'Paid Amount': Number(app.paidAmount || 0),
        'Created At': app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '',
        'Updated At': app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '',
      }));
    } else {
      // If we got data from backend, format it properly
      items = items.map((it: any) => ({
        'Application ID': it['Application ID'] || it.id,
        'Order ID': it['Order ID'] || it.orderId || it.code,
        'User Name': it['User Name'] || it.user?.name || '',
        'User Email': it['User Email'] || it.user?.email || it.email || '',
        'Phone': it['Phone'] || it.user?.phone || '',
        'Status': it['Status'] || it.applicationStatus || it.status || '',
        'Total Amount': it['Total Amount'] || Number(it.amountPaidTotal ?? it.totalAmount ?? it.amountPaid ?? 0),
        'Paid Amount': it['Paid Amount'] || Number(it.amountPaid ?? it.paidAmount ?? 0),
        'Created At': it['Created At'] || (it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ''),
        'Updated At': it['Updated At'] || (it.updatedAt ? new Date(it.updatedAt).toLocaleDateString() : ''),
      }));
    }

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Export applications error:', error);
    return NextResponse.json(
      { error: 'Failed to export applications' },
      { status: 500 }
    );
  }
}

