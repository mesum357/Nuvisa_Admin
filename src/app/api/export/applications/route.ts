import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) where.submittedAt.lte = new Date(endDate);
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const csvData = applications.map((app) => ({
      'Application No': app.applicationNo,
      'User Name': app.user.name,
      'User Email': app.user.email,
      'Phone': app.user.phone || '',
      'Status': app.status,
      'Total Amount': Number(app.totalAmount),
      'Paid Amount': Number(app.paidAmount),
      'Appointment Date': app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString() : '',
      'Submitted At': new Date(app.submittedAt).toLocaleDateString(),
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

