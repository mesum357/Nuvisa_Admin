import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';
import { canViewAmounts } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6months'; // 1month, 3months, 6months, 1year
    const metric = searchParams.get('metric') || 'all'; // applications, users, revenue, pending

    console.log('Historical API called with:', { period, metric });

    // Calculate date ranges based on period
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    let startDate: Date;
    switch (period) {
      case '1month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case '3months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case '6months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        break;
      case '1year':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    }

    // Fetch applications and users data for the period
    const [applicationsRes, usersRes] = await Promise.all([
      backendGet('/orders/search', { 
        page_no: 1, 
        page_size: 10000, // Get more data for historical analysis
        dateFrom: startDate.toISOString().split('T')[0],
        dateTo: endDate.toISOString().split('T')[0]
      }),
      backendGet('/orders/users', { 
        page_no: 1, 
        page_size: 10000,
        dateFrom: startDate.toISOString().split('T')[0],
        dateTo: endDate.toISOString().split('T')[0]
      }),
    ]);

    // Extract data
    let applicationsData = [];
    if (applicationsRes.ok && applicationsRes.data) {
      const appData = applicationsRes.data?.data?.results || applicationsRes.data?.results || applicationsRes.data?.data || applicationsRes.data;
      applicationsData = Array.isArray(appData) ? appData : (appData?.applications || []);
    } else {
      console.log('Applications API response:', applicationsRes);
    }

    let usersData = [];
    if (usersRes.ok && usersRes.data) {
      const userData = usersRes.data?.data?.results || usersRes.data?.results || usersRes.data?.data || usersRes.data;
      usersData = Array.isArray(userData) ? userData : (userData?.users || userData?.rows || []);
    } else {
      console.log('Users API response:', usersRes);
    }

    console.log('Extracted data:', { 
      applicationsCount: applicationsData.length, 
      usersCount: usersData.length,
      period,
      metric 
    });

    // Generate monthly data points
    let monthlyData = generateMonthlyData(startDate, endDate, applicationsData, usersData);

    // Ensure we have at least some data
    if (monthlyData.length === 0) {
      // Generate empty monthly data for the period
      const emptyMonthlyData = [];
      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        emptyMonthlyData.push({
          month: monthStart.toISOString().substring(0, 7),
          monthName: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          applications: 0,
          users: 0,
          revenue: 0,
          statusBreakdown: {
            pending: 0,
            inProgress: 0,
            approved: 0,
            rejected: 0,
            completed: 0,
          },
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      monthlyData.push(...emptyMonthlyData);
    }

    // Redact revenue if user cannot view amounts
    const allowAmounts = canViewAmounts(session.user);
    if (!allowAmounts) {
      monthlyData = monthlyData.map((m: any) => ({
        ...m,
        revenue: 0,
      }));
    }

    // Calculate trends (uses redacted revenue when not allowed)
    const trends = calculateTrends(monthlyData);

    const response = {
      period,
      metric,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthlyData,
      trends,
      summary: {
        totalApplications: applicationsData.length,
        totalUsers: usersData.length,
        totalRevenue: allowAmounts ? calculateTotalRevenue(applicationsData) : 0,
        averageApplicationsPerMonth: monthlyData.length > 0 ? 
          Math.round(monthlyData.reduce((sum, month) => sum + month.applications, 0) / monthlyData.length) : 0,
        averageUsersPerMonth: monthlyData.length > 0 ? 
          Math.round(monthlyData.reduce((sum, month) => sum + month.users, 0) / monthlyData.length) : 0,
        averageRevenuePerMonth: monthlyData.length > 0 ? 
          Math.round(monthlyData.reduce((sum, month) => sum + month.revenue, 0) / monthlyData.length) : 0,
      }
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Historical dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function generateMonthlyData(startDate: Date, endDate: Date, applicationsData: any[], usersData: any[]) {
  try {
    const monthlyData = [];
    const currentDate = new Date(startDate);

    // Ensure we have valid arrays
    const safeApplicationsData = Array.isArray(applicationsData) ? applicationsData : [];
    const safeUsersData = Array.isArray(usersData) ? usersData : [];

    while (currentDate < endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      // Filter data for this month
      const monthApplications = safeApplicationsData.filter((app: any) => {
        try {
          const appDate = new Date(app?.createdAt || app?.created_at || new Date());
          return appDate >= monthStart && appDate <= monthEnd;
        } catch (error) {
          console.error('Error parsing application date:', error, app);
          return false;
        }
      });

      const monthUsers = safeUsersData.filter((user: any) => {
        try {
          const userDate = new Date(user?.createdAt || user?.created_at || new Date());
          return userDate >= monthStart && userDate <= monthEnd;
        } catch (error) {
          console.error('Error parsing user date:', error, user);
          return false;
        }
      });

      // Calculate revenue for this month
      const monthRevenue = monthApplications.reduce((sum: number, app: any) => {
        try {
          let appTotal = 0;
          if (Array.isArray(app?.travelersData) && app.travelersData.length > 0) {
            app.travelersData.forEach((traveler: any) => {
              const fullPayment = traveler?.fullPayment?.paymentCompleted 
                ? Number(traveler?.fullPayment?.paymentAmount || 0) 
                : 0;
              const insurance = traveler?.insurance?.insurancePaymentCompleted || traveler?.insurance?.paymentCompleted
                ? Number(traveler?.insurance?.paymentAmount || 0)
                : 0;
              appTotal += fullPayment + insurance;
            });
          }
          if (appTotal === 0) {
            appTotal = Number(app?.amountPaidTotal || app?.amountPaid || 0);
          }
          return sum + appTotal;
        } catch (error) {
          console.error('Error calculating app revenue:', error, app);
          return sum;
        }
      }, 0);

      // Calculate status breakdown for this month
      const statusBreakdown = {
        pending: monthApplications.filter((app: any) => {
          const status = app?.applicationStatus?.toLowerCase() || '';
          return ['new', 'draft', 'submitted', 'pending'].includes(status);
        }).length,
        inProgress: monthApplications.filter((app: any) => {
          const status = app?.applicationStatus?.toLowerCase() || '';
          return ['under_review', 'processing', 'appointment_booked', 'at_embassy'].includes(status);
        }).length,
        approved: monthApplications.filter((app: any) => {
          const status = app?.applicationStatus?.toLowerCase() || '';
          return status === 'approved';
        }).length,
        rejected: monthApplications.filter((app: any) => {
          const status = app?.applicationStatus?.toLowerCase() || '';
          return ['rejected', 'cancelled'].includes(status);
        }).length,
        completed: monthApplications.filter((app: any) => {
          const status = app?.applicationStatus?.toLowerCase() || '';
          return status === 'completed';
        }).length,
      };

      monthlyData.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        monthName: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        applications: monthApplications.length,
        users: monthUsers.length,
        revenue: monthRevenue,
        statusBreakdown,
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyData;
  } catch (error) {
    console.error('Error in generateMonthlyData:', error);
    return [];
  }
}

function calculateTrends(monthlyData: any[]) {
  try {
    if (!monthlyData || !Array.isArray(monthlyData) || monthlyData.length < 2) {
      return {
        applications: { trend: 0, percentage: 0 },
        users: { trend: 0, percentage: 0 },
        revenue: { trend: 0, percentage: 0 },
        pending: { trend: 0, percentage: 0 },
      };
    }

    const calculateTrend = (values: number[]) => {
      if (!values || !Array.isArray(values) || values.length === 0) {
        return { trend: 0, percentage: 0 };
      }
      
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + (val || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + (val || 0), 0) / secondHalf.length;
      
      const trend = secondAvg - firstAvg;
      const percentage = firstAvg > 0 ? (trend / firstAvg) * 100 : 0;
      
      return { trend, percentage };
    };

    const applications = calculateTrend(monthlyData.map(m => m?.applications || 0));
    const users = calculateTrend(monthlyData.map(m => m?.users || 0));
    const revenue = calculateTrend(monthlyData.map(m => m?.revenue || 0));
    const pending = calculateTrend(monthlyData.map(m => m?.statusBreakdown?.pending || 0));

    return { applications, users, revenue, pending };
  } catch (error) {
    console.error('Error in calculateTrends:', error);
    return {
      applications: { trend: 0, percentage: 0 },
      users: { trend: 0, percentage: 0 },
      revenue: { trend: 0, percentage: 0 },
      pending: { trend: 0, percentage: 0 },
    };
  }
}

function calculateTotalRevenue(applicationsData: any[]): number {
  return applicationsData.reduce((sum: number, app: any) => {
    let appTotal = 0;
    if (Array.isArray(app.travelersData) && app.travelersData.length > 0) {
      app.travelersData.forEach((traveler: any) => {
        const fullPayment = traveler?.fullPayment?.paymentCompleted 
          ? Number(traveler?.fullPayment?.paymentAmount || 0) 
          : 0;
        const insurance = traveler?.insurance?.insurancePaymentCompleted || traveler?.insurance?.paymentCompleted
          ? Number(traveler?.insurance?.paymentAmount || 0)
          : 0;
        appTotal += fullPayment + insurance;
      });
    }
    if (appTotal === 0) {
      appTotal = Number(app.amountPaidTotal || app.amountPaid || 0);
    }
    return sum + appTotal;
  }, 0);
}
