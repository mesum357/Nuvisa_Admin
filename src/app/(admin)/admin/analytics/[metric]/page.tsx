"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, canViewAmounts } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface HistoricalData {
  period: string;
  metric: string;
  startDate: string;
  endDate: string;
  monthlyData: Array<{
    month: string;
    monthName: string;
    applications: number;
    users: number;
    revenue: number;
    statusBreakdown: {
      pending: number;
      inProgress: number;
      approved: number;
      rejected: number;
      completed: number;
    };
  }>;
  trends: {
    applications: { trend: number; percentage: number };
    users: { trend: number; percentage: number };
    revenue: { trend: number; percentage: number };
    pending: { trend: number; percentage: number };
  };
  summary: {
    totalApplications: number;
    totalUsers: number;
    totalRevenue: number;
    averageApplicationsPerMonth: number;
    averageUsersPerMonth: number;
    averageRevenuePerMonth: number;
  };
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const metric = params.metric as 'applications' | 'users' | 'revenue' | 'pending';
  const { data: session } = useSession();
  
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('6months');

  const getTitle = () => {
    switch (metric) {
      case 'applications': return 'Total Applications';
      case 'users': return 'Total Users';
      case 'revenue': return 'Total Revenue';
      case 'pending': return 'Pending Applications';
      default: return 'Analytics';
    }
  };

  const fetchHistoricalData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<HistoricalData>('/dashboard/historical', {
        period,
        metric,
      });
      
      if (response.success && response.data) {
        // Validate the data structure
        const validatedData = {
          ...response.data,
          monthlyData: Array.isArray(response.data.monthlyData) ? response.data.monthlyData : [],
          summary: response.data.summary || {
            totalApplications: 0,
            totalUsers: 0,
            totalRevenue: 0,
            averageApplicationsPerMonth: 0,
            averageUsersPerMonth: 0,
            averageRevenuePerMonth: 0,
          },
          trends: response.data.trends || {
            applications: { trend: 0, percentage: 0 },
            users: { trend: 0, percentage: 0 },
            revenue: { trend: 0, percentage: 0 },
            pending: { trend: 0, percentage: 0 },
          },
        };
        setData(validatedData);
      } else {
        console.error('Failed to fetch historical data:', response.error);
        setData(null);
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, metric]);

  useEffect(() => {
    // Gate revenue metric to super admin only
    if (metric === 'revenue' && !canViewAmounts(session?.user)) {
      router.replace('/admin');
      return;
    }
    if (metric) {
      fetchHistoricalData();
    }
  }, [metric, period, session, fetchHistoricalData, router]);

  const getChartOptions = () => {
    if (!data || !data.monthlyData || !Array.isArray(data.monthlyData) || data.monthlyData.length === 0) {
      return {
        chart: {
          type: 'bar' as const,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          background: 'transparent',
        },
        xaxis: {
          categories: ['No Data'],
          labels: { style: { colors: '#6B7280', fontSize: '12px' } },
        },
        yaxis: {
          title: { text: 'Count' },
          labels: { style: { colors: '#6B7280', fontSize: '12px' } },
        },
        series: [{ name: 'No Data', data: [0] }],
      };
    }

    const chartType = metric === 'revenue' ? 'area' as const : 'bar' as const;
    const yAxisTitle = metric === 'revenue' ? 'Revenue ($)' : 
                      metric === 'applications' ? 'Applications' :
                      metric === 'users' ? 'Users' : 'Count';

    try {
      // Ensure categories are valid strings
      const categories = data.monthlyData.map(d => {
        const monthName = d?.monthName || d?.month || 'Unknown';
        return typeof monthName === 'string' ? monthName : 'Unknown';
      });

      return {
        chart: {
          type: chartType,
          fontFamily: 'Inter, sans-serif',
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true,
            },
          },
          background: 'transparent',
        },
        theme: {
          mode: 'light' as const,
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              colors: '#6B7280',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          title: {
            text: yAxisTitle,
            style: {
              color: '#374151',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            },
          },
          labels: {
            style: {
              colors: '#6B7280',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            },
            formatter: (value: number) => {
              if (metric === 'revenue') {
                return formatCurrency(value);
              }
              return value.toLocaleString();
            },
          },
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.8,
            opacityTo: 0.2,
            stops: [0, 100],
          },
        },
        stroke: {
          curve: 'smooth' as const,
          width: 3,
          lineCap: 'round' as const,
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          borderColor: '#F3F4F6',
          strokeDashArray: 0,
          xaxis: {
            lines: {
              show: true,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        tooltip: {
          theme: 'light' as const,
          style: {
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          },
          y: {
            formatter: (value: number) => {
              if (metric === 'revenue') {
                return formatCurrency(value);
              }
              return value.toLocaleString();
            },
          },
        },
        legend: {
          position: 'top' as const,
          horizontalAlign: 'right' as const,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          labels: {
            colors: '#374151',
          },
        },
      };
    } catch (error) {
      console.error('Error in getChartOptions:', error);
      return {
        chart: {
          type: 'bar' as const,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          background: 'transparent',
        },
        xaxis: {
          categories: ['Error'],
          labels: { style: { colors: '#6B7280', fontSize: '12px' } },
        },
        yaxis: {
          title: { text: 'Count' },
          labels: { style: { colors: '#6B7280', fontSize: '12px' } },
        },
        series: [{ name: 'Error', data: [0] }],
      };
    }
  };

  const getChartSeries = () => {
    if (!data || !data.monthlyData || !Array.isArray(data.monthlyData) || data.monthlyData.length === 0) {
      return [{
        name: 'No Data',
        data: [0]
      }];
    }

    try {
      // Ensure all data arrays are valid numbers
      const safeMapData = (mapper: (d: any) => number) => {
        return data.monthlyData.map(d => {
          const value = mapper(d);
          return typeof value === 'number' && !isNaN(value) ? value : 0;
        });
      };

      switch (metric) {
        case 'applications':
          return [{
            name: 'Applications',
            data: safeMapData(d => d?.applications || 0),
          }];
        case 'users':
          return [{
            name: 'Users',
            data: safeMapData(d => d?.users || 0),
          }];
        case 'revenue':
          return [{
            name: 'Revenue',
            data: safeMapData(d => d?.revenue || 0),
          }];
        case 'pending':
          return [
            {
              name: 'Pending',
              data: safeMapData(d => d?.statusBreakdown?.pending || 0),
            },
            {
              name: 'In Progress',
              data: safeMapData(d => d?.statusBreakdown?.inProgress || 0),
            },
            {
              name: 'Decision Made, Passport Dispatched/Ready',
              data: safeMapData(d => d?.statusBreakdown?.decision_made || 0),
            },
            {
              name: 'Completed',
              data: safeMapData(d => d?.statusBreakdown?.completed || 0),
            },
          ];
        default:
          return [{
            name: 'No Data',
            data: [0]
          }];
      }
    } catch (error) {
      console.error('Error in getChartSeries:', error);
      return [{
        name: 'Error',
        data: [0]
      }];
    }
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? '↗' : '↘';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getTitle()} - Historical Data</h1>
                <p className="text-sm text-gray-600 mt-1">Track trends and performance over time</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Total {getTitle()}</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {metric === 'revenue' ? formatCurrency(data.summary?.totalRevenue || 0) : 
                   metric === 'applications' ? (data.summary?.totalApplications || 0).toLocaleString() :
                   metric === 'users' ? (data.summary?.totalUsers || 0).toLocaleString() :
                   (data.summary?.totalApplications || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <h3 className="text-sm font-medium text-green-700 mb-2">Average per Month</h3>
                <p className="text-2xl font-bold text-green-900">
                  {metric === 'revenue' ? formatCurrency(data.summary?.averageRevenuePerMonth || 0) :
                   metric === 'applications' ? (data.summary?.averageApplicationsPerMonth || 0).toLocaleString() :
                   metric === 'users' ? (data.summary?.averageUsersPerMonth || 0).toLocaleString() :
                   (data.summary?.averageApplicationsPerMonth || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-sm font-medium text-purple-700 mb-2">Trend</h3>
                <p className={`text-2xl font-bold ${getTrendColor(data.trends?.[metric]?.percentage || 0)}`}>
                  {getTrendIcon(data.trends?.[metric]?.trend || 0)} {Math.abs(data.trends?.[metric]?.percentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {getTitle()} Over Time
              </h3>
              <div className="h-96">
                {data && data.monthlyData && Array.isArray(data.monthlyData) && data.monthlyData.length > 0 ? (
                  <Chart
                    options={getChartOptions()}
                    series={getChartSeries()}
                    type={metric === 'revenue' ? 'area' : 'bar'}
                    height="100%"
                    width="100%"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-lg font-medium">No chart data available</p>
                      <p className="text-sm">Try selecting a different time period</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Monthly Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      {metric === 'pending' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pending
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Approved
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rejected
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.monthlyData && Array.isArray(data.monthlyData) ? data.monthlyData.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month?.monthName || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(month?.applications || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(month?.users || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(month?.revenue || 0)}
                        </td>
                        {metric === 'pending' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {(month?.statusBreakdown?.pending || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {(month?.statusBreakdown?.approved || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {(month?.statusBreakdown?.rejected || 0).toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={metric === 'pending' ? 7 : 4} className="px-6 py-4 text-center text-sm text-gray-500">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No data available</p>
            <p className="text-gray-400 text-sm mt-1">Try selecting a different time period</p>
          </div>
        )}
      </div>
    </div>
  );
}
