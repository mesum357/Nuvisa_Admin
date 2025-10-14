import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { backendGet } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
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
      const be = await backendGet('/orders/search', {
        page_no: 1,
        page_size: 1000,
        status: mapStatus(status) || undefined,
        q: undefined,
      });
      if (be.ok) {
        const env = (be.data as any) || {};
        const results = env?.data?.results ?? env?.results ?? env ?? {};
        items = Array.isArray(results) ? results : (results.applications || results.items || results.rows || []);
      }
    } catch {}

    // Fallback to Prisma if backend failed
    if (!Array.isArray(items) || items.length === 0) {
      const where: any = {};
      if (status) where.status = status;
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
        id: app.id,
        code: app.applicationNo,
        applicationStatus: app.status,
        amountPaidTotal: Number(app.totalAmount),
        amountPaid: Number(app.paidAmount),
        createdAt: app.submittedAt,
        email: app.user?.email,
        user: app.user,
      }));
    }

    const csvData = items.map((it: any) => ({
      'Application No': it.code || it.orderId || it.id,
      'User Name': it.user?.name || it.email || '',
      'User Email': it.user?.email || it.email || '',
      'Phone': it.user?.phone || '',
      'Status': it.applicationStatus || it.status || '',
      'Total Amount': Number(it.amountPaidTotal ?? it.totalAmount ?? it.amountPaid ?? 0),
      'Paid Amount': Number(it.amountPaid ?? it.paidAmount ?? 0),
      'Submitted At': new Date(it.createdAt || it.submittedAt || Date.now()).toLocaleDateString(),
    }));

    return NextResponse.json({
      success: true,
      data: csvData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export applications' },
      { status: 500 }
    );
  }
}

