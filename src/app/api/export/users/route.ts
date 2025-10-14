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

    const where: any = {};

    if (status) {
      where.status = status;
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

    const csvData = users.map((user) => ({
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone || '',
      'Status': user.status,
      'Verified': user.isVerified ? 'Yes' : 'No',
      'Email Verified': user.emailVerified ? 'Yes' : 'No',
      'Applications': user._count.applications,
      'Created At': new Date(user.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json({
      success: true,
      data: csvData,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}

