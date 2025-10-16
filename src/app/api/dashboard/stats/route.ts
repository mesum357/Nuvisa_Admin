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

    // Fetch multiple data sources in parallel
    const [statsRes, applicationsRes, usersRes] = await Promise.all([
      backendGet('/orders/stats'),
      backendGet('/orders/search', { page_no: 1, page_size: 1000 }), // Get all applications for calculations
      backendGet('/orders/users', { page_no: 1, page_size: 1000 }), // Get all users
    ]);

    if (!statsRes.ok) {
      return NextResponse.json(statsRes.data || { error: 'Backend error' }, { status: statsRes.status });
    }

    // Debug logging to understand data structure
    console.log('Stats response:', { ok: statsRes.ok, data: statsRes.data });
    console.log('Applications response:', { ok: applicationsRes.ok, data: applicationsRes.data });
    console.log('Users response:', { ok: usersRes.ok, data: usersRes.data });

    const statsData = statsRes.data?.data || statsRes.data || {};
    
    // Safely extract applications data with proper fallbacks
    let applicationsData = [];
    if (applicationsRes.ok && applicationsRes.data) {
      const appData = applicationsRes.data?.data?.results || applicationsRes.data?.results || applicationsRes.data?.data || applicationsRes.data;
      applicationsData = Array.isArray(appData) ? appData : (appData?.applications || []);
    }
    
    // Safely extract users data with proper fallbacks
    let usersData = [];
    if (usersRes.ok && usersRes.data) {
      const userData = usersRes.data?.data?.results || usersRes.data?.results || usersRes.data?.data || usersRes.data;
      usersData = Array.isArray(userData) ? userData : (userData?.users || []);
    }

    // Calculate today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Calculate additional statistics
    const totalApplications = Number(statsData?.total ?? 0);
    const pendingApplications = Number(statsData?.pending ?? 0);
    const inProgress = Number(statsData?.in_progress ?? 0);
    const completed = Number(statsData?.completed ?? 0);
    const rejected = Number(statsData?.rejected ?? 0);

    // Calculate revenue from applications (ensure applicationsData is an array)
    const totalRevenue = Array.isArray(applicationsData) ? applicationsData.reduce((sum: number, app: any) => {
      return sum + (Number(app.amountPaid) || 0);
    }, 0) : 0;

    // Calculate today's applications (ensure applicationsData is an array)
    const todayApplications = Array.isArray(applicationsData) ? applicationsData.filter((app: any) => {
      const appDate = new Date(app.createdAt);
      return appDate >= startOfToday && appDate < endOfToday;
    }) : [];

    // Calculate today's users (ensure usersData is an array)
    const todayUsers = Array.isArray(usersData) ? usersData.filter((user: any) => {
      const userDate = new Date(user.createdAt || user.created_at);
      return userDate >= startOfToday && userDate < endOfToday;
    }) : [];

    // Calculate this month's revenue (ensure applicationsData is an array)
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthRevenue = Array.isArray(applicationsData) ? applicationsData.filter((app: any) => {
      const appDate = new Date(app.createdAt);
      return appDate >= thisMonthStart && appDate < today;
    }).reduce((sum: number, app: any) => {
      return sum + (Number(app.amountPaid) || 0);
    }, 0) : 0;

    const normalized: DashboardStats = {
      totalApplications,
      totalUsers: Array.isArray(usersData) ? usersData.length : 0,
      totalRevenue,
      pendingApplications,
      approvedApplications: completed,
      rejectedApplications: rejected,
      newApplicationsToday: Array.isArray(todayApplications) ? todayApplications.length : 0,
      newUsersToday: Array.isArray(todayUsers) ? todayUsers.length : 0,
      revenueThisMonth: thisMonthRevenue,
      applicationsByStatus: [
        { status: 'PENDING' as any, count: pendingApplications },
        { status: 'UNDER_REVIEW' as any, count: inProgress },
        { status: 'APPROVED' as any, count: completed },
        { status: 'REJECTED' as any, count: rejected },
      ],
      recentApplications: Array.isArray(todayApplications) ? todayApplications.slice(0, 5) : [], // Show today's applications instead of recent
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

