import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DashboardStats } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalApplications,
      totalUsers,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      newApplicationsToday,
      newUsersToday,
      revenueData,
      monthlyRevenue,
      applicationsByStatus,
      recentApplications,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.user.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({
        where: { submittedAt: { gte: today } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.application.aggregate({
        _sum: { paidAmount: true },
      }),
      prisma.application.aggregate({
        _sum: { paidAmount: true },
        where: { submittedAt: { gte: firstDayOfMonth } },
      }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.application.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const stats: DashboardStats = {
      totalApplications,
      totalUsers,
      totalRevenue: Number(revenueData._sum.paidAmount || 0),
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      newApplicationsToday,
      newUsersToday,
      revenueThisMonth: Number(monthlyRevenue._sum.paidAmount || 0),
      applicationsByStatus: applicationsByStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      recentApplications: recentApplications.map((app) => ({
        ...app,
        totalAmount: Number(app.totalAmount),
        paidAmount: Number(app.paidAmount),
      })),
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

