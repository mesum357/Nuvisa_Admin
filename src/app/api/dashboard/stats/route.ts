import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';
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

    // Proxy to backend /orders/stats and normalize to DashboardStats shape
    const sessionUserEmail = (session.user as any)?.email as string | undefined;
    console.log('Fetching stats for user:', sessionUserEmail);
    const res = await backendGet('/orders/stats', undefined, sessionUserEmail);
    console.log('Backend response:', { ok: res.ok, status: res.status, data: res.data });
    if (!res.ok) {
      return NextResponse.json(res.data || { error: 'Backend error' }, { status: res.status });
    }

    const envelope = (res.data as any) || {};
    const data = envelope?.data || envelope;

    // Backend returns: { total, pending, in_progress, completed, rejected }
    const total = Number(data?.total ?? 0);
    const pending = Number(data?.pending ?? 0);
    const inProgress = Number(data?.in_progress ?? 0);
    const completed = Number(data?.completed ?? 0);
    const rejected = Number(data?.rejected ?? 0);

    const normalized: DashboardStats = {
      totalApplications: total,
      totalUsers: 0,
      totalRevenue: 0,
      pendingApplications: pending,
      approvedApplications: completed, // backend groups completed+approved, map to approved
      rejectedApplications: rejected,
      newApplicationsToday: 0,
      newUsersToday: 0,
      revenueThisMonth: 0,
      applicationsByStatus: [
        { status: 'PENDING' as any, count: pending },
        { status: 'UNDER_REVIEW' as any, count: inProgress },
        { status: 'APPROVED' as any, count: completed },
        { status: 'REJECTED' as any, count: rejected },
      ],
      recentApplications: [],
    };

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

