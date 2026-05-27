import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';
import { DashboardStats } from '@/types';
import { canViewAmounts } from '@/lib/utils';
import {
  DASHBOARD_STATS_CACHE_MS,
  readRouteCache,
  writeRouteCache,
} from '@/lib/routeCache';

function extractApplicationsList(payload: unknown): any[] {
  if (!payload || typeof payload !== 'object') return [];
  const envelope = payload as Record<string, unknown>;
  const results =
    (envelope.data as Record<string, unknown> | undefined)?.results ??
    envelope.results ??
    envelope.data ??
    envelope;
  if (Array.isArray(results)) return results;
  if (results && typeof results === 'object') {
    const obj = results as Record<string, unknown>;
    const list =
      obj.applications || obj.items || obj.list || obj.rows || [];
    return Array.isArray(list) ? list : [];
  }
  return [];
}

function mapRecentApplication(app: any) {
  const rawId = app.id || app.applicationId || app.code || app.orderId || app._id;
  const toDigits = (source: unknown, length: number) => {
    if (!source) return ''.padStart(length, '0');
    let digits = String(source).replace(/\D+/g, '');
    if (digits.length < length) {
      const codes = Array.from(String(source))
        .map((c) => c.charCodeAt(0))
        .join('');
      digits = (digits + codes).replace(/\D+/g, '');
    }
    if (!digits.length) digits = '0'.repeat(length);
    return digits.slice(-length).padStart(length, '0');
  };

  return {
    id: app.id || app.applicationId || app.orderId,
    applicationNo:
      app.formattedApplicationId ||
      (rawId ? `AI${toDigits(rawId, 8)}` : String(app.applicationNo || '')),
    status: app.status || app.applicationStatus || 'PENDING',
    totalAmount: Number(app.totalAmount || app.amountPaid || app.amountPaidTotal || 0),
    paidAmount: Number(app.paidAmount || app.amountPaid || app.amountPaidTotal || 0),
    submittedAt:
      app.submittedAt || app.createdAt || app.created_at || new Date().toISOString(),
    userId: app.userId || app.email || app.user?.id,
    updatedAt:
      app.updatedAt ||
      app.updated_at ||
      app.createdAt ||
      app.created_at ||
      new Date().toISOString(),
    user: app.user || {
      id: app.email || app.userId,
      name: app.userName || app.name || app.email,
      email: app.email,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `dashboard-stats:${(session.user as { email?: string })?.email || 'anon'}`;
    const cached = readRouteCache<DashboardStats>('dashboard', cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [statsRes, applicationsRes, usersRes] = await Promise.all([
      backendGet('/orders/stats'),
      backendGet('/orders/search', { page: 1, limit: 80, sortBy: 'createdAt', sortOrder: 'DESC' }),
      backendGet('/orders/users', { page: 1, limit: 1 }),
    ]);

    if (!statsRes.ok) {
      return NextResponse.json(statsRes.data || { error: 'Backend error' }, { status: statsRes.status });
    }

    const statsData = statsRes.data?.data || statsRes.data || {};
    const applicationsData = applicationsRes.ok
      ? extractApplicationsList(applicationsRes.data)
      : [];

    const usersEnvelope = usersRes.ok ? usersRes.data : null;
    const totalUsers =
      Number(
        usersEnvelope?.data?.pagination?.total ??
          usersEnvelope?.pagination?.total ??
          usersEnvelope?.data?.total ??
          0,
      ) || 0;

    const totalApplications = Number(statsData?.total ?? applicationsData.length ?? 0);
    const pendingApplications = Number(statsData?.pending ?? 0);
    const submittedApplications = Number(statsData?.submitted ?? 0);
    const inProgress = Number(statsData?.in_progress ?? 0);
    const completed = Number(statsData?.completed ?? 0);
    const approved = Number(statsData?.approved ?? 0);
    const rejected = Number(statsData?.rejected ?? 0);
    const decisionMade = approved + rejected;

    const sumPaidAmount = (apps: any[]) =>
      apps.reduce(
        (sum, app) => sum + Number(app.amountPaidTotal || app.amountPaid || app.paidAmount || 0),
        0,
      );

    const totalRevenue = canViewAmounts(session.user)
      ? sumPaidAmount(applicationsData)
      : 0;

    const thisMonthRevenue = canViewAmounts(session.user)
      ? sumPaidAmount(
          applicationsData.filter((app) => {
            const appDate = new Date(app.createdAt || app.created_at || 0);
            return appDate >= thisMonthStart && appDate < endOfToday;
          }),
        )
      : 0;

    const recentApplications = applicationsData
      .filter((app) => {
        const appDate = new Date(app.createdAt || app.created_at || 0);
      return appDate >= thirtyDaysAgo && appDate < endOfToday;
      })
      .map(mapRecentApplication);

    const todayApplications = recentApplications.filter((app) => {
      const appDate = new Date(app.submittedAt);
      return appDate >= startOfToday && appDate < endOfToday;
    });

    const todayUsers =
      usersRes.ok && Array.isArray(usersEnvelope?.data?.users)
        ? usersEnvelope.data.users.filter((user: any) => {
      const userDate = new Date(user.createdAt || user.created_at);
      return userDate >= startOfToday && userDate < endOfToday;
          }).length
        : 0;

    const normalized: DashboardStats = {
      totalApplications,
      totalUsers,
      totalRevenue,
      pendingApplications,
      submittedApplications,
      approvedApplications: decisionMade + approved + rejected,
      rejectedApplications: rejected,
      newApplicationsToday: todayApplications.length,
      newUsersToday: todayUsers,
      revenueThisMonth: thisMonthRevenue,
      applicationsByStatus: [
        { status: 'PENDING' as any, count: pendingApplications || 0 },
        { status: 'SUBMITTED' as any, count: submittedApplications || 0 },
        { status: 'UNDER_REVIEW' as any, count: inProgress || 0 },
        { status: 'DECISION_MADE' as any, count: decisionMade || 0 },
        { status: 'COMPLETED' as any, count: completed || 0 },
      ],
      recentApplications: recentApplications.slice(0, 5),
    };

    writeRouteCache('dashboard', cacheKey, normalized, DASHBOARD_STATS_CACHE_MS);

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
