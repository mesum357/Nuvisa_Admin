"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { DashboardStats as IDashboardStats } from '@/types';
import { ArrowUpIcon, ArrowDownIcon, GroupIcon, BoxIconLine } from '@/icons';
import Badge from '../ui/badge/Badge';
import { formatCurrency } from '@/lib/utils';

export default function DashboardStats() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true);
    }
    const response = await apiClient.get<IDashboardStats>('/dashboard/stats');
    if (response.success && response.data) {
      setStats(response.data);
    }
    if (showLoading) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // No auto-refresh; fetch once on mount

  const metrics = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        title: 'Total Applications',
        value: stats.totalApplications.toLocaleString(),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        change: stats.newApplicationsToday,
        changeLabel: 'today',
        positive: true,
      },
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
        change: stats.newUsersToday,
        changeLabel: 'today',
        positive: true,
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        change: formatCurrency(stats.revenueThisMonth),
        changeLabel: 'this month',
        positive: true,
      },
      {
        title: 'Pending Applications',
        value: stats.pendingApplications.toLocaleString(),
        icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
        subValue: `${stats.approvedApplications.toLocaleString()} approved, ${stats.rejectedApplications.toLocaleString()} rejected`,
        positive: false,
      },
    ];
  }, [stats]);

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
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
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
        </div>
      ))}
    </div>
  );
}

