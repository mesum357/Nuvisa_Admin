"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/context/DashboardDataContext';
import { ArrowUpIcon, ArrowDownIcon, GroupIcon, BoxIconLine } from '@/icons';
import Badge from '../ui/badge/Badge';
import { formatCurrency, canViewAmounts } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function DashboardStats() {
  const router = useRouter();
  const { data: session } = useSession();
  const { stats, loading } = useDashboardData();

  const handleMetricClick = (metric: 'applications' | 'users' | 'revenue' | 'pending' | 'submitted') => {
    router.push(`/admin/analytics/${metric}`);
  };

  const metrics = useMemo(() => {
    if (!stats) return [];
    
    const items: Array<{
      title: string;
      value: string;
      icon: React.ReactNode;
      change?: number;
      changeLabel?: string;
      subValue?: string;
      positive: boolean;
      metric: 'applications' | 'users' | 'revenue' | 'pending' | 'submitted';
      clickable: boolean;
    }> = [
      {
        title: 'Total Applications',
        value: stats.totalApplications.toLocaleString(),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        change: stats.newApplicationsToday,
        changeLabel: 'today',
        positive: true,
        metric: 'applications' as const,
        clickable: true,
      },
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
        change: stats.newUsersToday,
        changeLabel: 'today',
        positive: true,
        metric: 'users' as const,
        clickable: true,
      },
      {
        title: 'Draft Applications',
        value: stats.pendingApplications.toLocaleString(),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        subValue: 'Not yet submitted by users',
        positive: false,
        metric: 'pending' as const,
        clickable: true,
      },
      {
        title: 'Submitted Applications',
        value: stats.submittedApplications.toLocaleString(),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        subValue: `${stats.approvedApplications.toLocaleString()} decision made`,
        positive: true,
        metric: 'submitted' as const,
        clickable: true,
      },
    ];

    if (canViewAmounts(session?.user)) {
      items.splice(2, 0, {
        title: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        change: stats.revenueThisMonth,
        changeLabel: 'this month',
        positive: true,
        metric: 'revenue' as const,
        clickable: true,
      });
    }

    return items;
  }, [stats, session?.user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 group ${
            metric.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-blue-300 dark:hover:border-blue-600' : ''
          }`}
          onClick={() => metric.clickable && handleMetricClick(metric.metric)}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {metric.icon}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
              </h4>
              {metric.subValue && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metric.subValue}
                </p>
              )}
            </div>
            {metric.change !== undefined && (
              <div className="text-right">
                <Badge color={metric.positive ? 'success' : 'error'}>
                  {metric.positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  {metric.change}
                </Badge>
                {metric.changeLabel && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metric.changeLabel}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {metric.clickable && (
            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view historical data
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

