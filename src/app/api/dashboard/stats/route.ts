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
    console.log('Stats response:', { ok: statsRes.ok, hasData: !!statsRes.data });
    console.log('Applications response:', { ok: applicationsRes.ok, hasData: !!applicationsRes.data });
    console.log('Users response:', { ok: usersRes.ok, hasData: !!usersRes.data });

    const statsData = statsRes.data?.data || statsRes.data || {};
    
    // Safely extract applications data with proper fallbacks
    let applicationsData = [];
    if (applicationsRes.ok && applicationsRes.data) {
      const appData = applicationsRes.data?.data?.results || applicationsRes.data?.results || applicationsRes.data?.data || applicationsRes.data;
      applicationsData = Array.isArray(appData) ? appData : (appData?.applications || []);
      console.log('Extracted applications count:', applicationsData.length);
    } else {
      console.warn('Failed to fetch applications data');
    }
    
    // Safely extract users data with proper fallbacks
    let usersData = [];
    if (usersRes.ok && usersRes.data) {
      const userData = usersRes.data?.data?.results || usersRes.data?.results || usersRes.data?.data || usersRes.data;
      usersData = Array.isArray(userData) ? userData : (userData?.users || userData?.rows || []);
      console.log('Extracted users count:', usersData.length);
    } else {
      console.warn('Failed to fetch users data');
    }

    // Calculate today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Calculate additional statistics
    // Use actual applications count as primary source, fallback to backend stats
    const totalApplications = Array.isArray(applicationsData) && applicationsData.length > 0 
      ? applicationsData.length 
      : Number(statsData?.total ?? 0);
    
    console.log('Total applications calculated:', totalApplications, '(from array:', applicationsData.length, ', from stats:', statsData?.total, ')');
    
    const pendingApplications = Number(statsData?.pending ?? 0);
    const inProgress = Number(statsData?.in_progress ?? 0);
    const completed = Number(statsData?.completed ?? 0);
    const rejected = Number(statsData?.rejected ?? 0);

    // Calculate revenue from applications (ensure applicationsData is an array)
    // Sum up all traveler payments for accurate revenue calculation
    // Note: Revenue is calculated globally. To filter by assigned admin, add an 
    // 'assignedAdminId' field to the Application model and filter here.
    const currentUserEmail = (session.user as { email?: string })?.email;
    const currentUserRole = (session.user as { role?: string })?.role;
    
    const revenueDebug = { fromTravelers: 0, fromAppLevel: 0, applicationsProcessed: 0 };
    
    const totalRevenue = Array.isArray(applicationsData) ? applicationsData.reduce((sum: number, app: any) => {
      // If admin assignment is implemented, filter here:
      // if (currentUserRole !== 'SUPER_ADMIN' && app.assignedAdminEmail !== currentUserEmail) return sum;
      
      revenueDebug.applicationsProcessed++;
      
      // Calculate total payment from all travelers
      let appTotal = 0;
      if (Array.isArray(app.travelersData) && app.travelersData.length > 0) {
        app.travelersData.forEach((traveler: any) => {
          // Only count completed payments
          const fullPayment = traveler?.fullPayment?.paymentCompleted 
            ? Number(traveler?.fullPayment?.paymentAmount || 0) 
            : 0;
          const insurance = traveler?.insurance?.insurancePaymentCompleted || traveler?.insurance?.paymentCompleted
            ? Number(traveler?.insurance?.paymentAmount || 0)
            : 0;
          appTotal += fullPayment + insurance;
        });
        if (appTotal > 0) {
          revenueDebug.fromTravelers += appTotal;
        }
      }
      
      // Fallback to application-level payment if no traveler data or no traveler payments
      if (appTotal === 0) {
        const appLevelAmount = Number(app.amountPaidTotal || app.amountPaid || 0);
        appTotal = appLevelAmount;
        if (appLevelAmount > 0) {
          revenueDebug.fromAppLevel += appLevelAmount;
        }
      }
      
      return sum + appTotal;
    }, 0) : 0;
    
    console.log('Total revenue calculated:', totalRevenue, 'Debug:', revenueDebug);

    // Calculate today's applications (ensure applicationsData is an array)
    const todayApplications = Array.isArray(applicationsData) ? applicationsData.filter((app: any) => {
      const appDate = new Date(app.createdAt || app.created_at || new Date());
      return appDate >= startOfToday && appDate < endOfToday;
    }).map((app: any) => ({
      id: app.id || app.applicationId || app.orderId,
      applicationNo: app.applicationNo || app.code || app.orderId || app.id,
      status: app.status || app.applicationStatus || 'PENDING',
      totalAmount: Number(app.totalAmount || app.amountPaid || app.amountPaidTotal || 0),
      paidAmount: Number(app.paidAmount || app.amountPaid || app.amountPaidTotal || 0),
      submittedAt: app.submittedAt || app.createdAt || app.created_at || new Date().toISOString(),
      userId: app.userId || app.email || app.user?.id,
      updatedAt: app.updatedAt || app.updated_at || app.createdAt || app.created_at || new Date().toISOString(),
      user: app.user || { 
        id: app.email || app.userId, 
        name: app.userName || app.name || app.email, 
        email: app.email 
      }
    })) : [];

    // Calculate today's users (ensure usersData is an array)
    const todayUsers = Array.isArray(usersData) ? usersData.filter((user: any) => {
      const userDate = new Date(user.createdAt || user.created_at);
      return userDate >= startOfToday && userDate < endOfToday;
    }) : [];

    // Calculate this month's revenue (ensure applicationsData is an array)
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthRevenue = Array.isArray(applicationsData) ? applicationsData.filter((app: any) => {
      const appDate = new Date(app.createdAt || app.created_at || new Date());
      return appDate >= thisMonthStart && appDate < endOfToday;
    }).reduce((sum: number, app: any) => {
      // Calculate from travelers if available
      let monthAppTotal = 0;
      if (Array.isArray(app.travelersData) && app.travelersData.length > 0) {
        app.travelersData.forEach((traveler: any) => {
          const fullPayment = traveler?.fullPayment?.paymentCompleted 
            ? Number(traveler?.fullPayment?.paymentAmount || 0) 
            : 0;
          const insurance = traveler?.insurance?.insurancePaymentCompleted || traveler?.insurance?.paymentCompleted
            ? Number(traveler?.insurance?.paymentAmount || 0)
            : 0;
          monthAppTotal += fullPayment + insurance;
        });
      }
      // Fallback to app-level payment
      if (monthAppTotal === 0) {
        monthAppTotal = Number(app.amountPaidTotal || app.amountPaid || 0);
      }
      return sum + monthAppTotal;
    }, 0) : 0;
    
    console.log('This month revenue calculated:', thisMonthRevenue);

    // Calculate total users - use actual fetched users count
    const totalUsers = Array.isArray(usersData) && usersData.length > 0 
      ? usersData.length 
      : 0;
    
    console.log('Total users calculated:', totalUsers);

    const normalized: DashboardStats = {
      totalApplications,
      totalUsers,
      totalRevenue,
      pendingApplications,
      approvedApplications: completed,
      rejectedApplications: rejected,
      newApplicationsToday: Array.isArray(todayApplications) ? todayApplications.length : 0,
      newUsersToday: Array.isArray(todayUsers) ? todayUsers.length : 0,
      revenueThisMonth: thisMonthRevenue,
      applicationsByStatus: [
        { status: 'PENDING' as any, count: pendingApplications || 0 },
        { status: 'UNDER_REVIEW' as any, count: inProgress || 0 },
        { status: 'APPROVED' as any, count: completed || 0 },
        { status: 'REJECTED' as any, count: rejected || 0 },
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

