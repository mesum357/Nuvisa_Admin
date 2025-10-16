"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { DashboardStats } from '@/types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function ApplicationStatusChart() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true);
    }
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    if (response.success && response.data) {
      setStats(response.data);
    }
    if (showLoading) {
      setLoading(false);
    }
  };

  // No auto-refresh; fetch once on mount

  if (loading || !stats) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 h-80 flex items-center justify-center">
        <div className="animate-pulse">Loading chart...</div>
      </div>
    );
  }

  const toTitleCase = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  const chartOptions: any = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
    },
    labels: stats.applicationsByStatus.map((item) => toTitleCase(String(item.status))),
    colors: ['#FCD34D', '#3B82F6', '#10B981', '#EF4444', '#6B7280'],
    legend: {
      position: 'bottom',
      labels: {
        colors: '#6B7280',
      },
    },
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
        },
      },
    },
  };

  const series = stats.applicationsByStatus.map((item) => item.count);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          Applications by Status
        </h3>
      </div>
      <div className="p-6">
        <Chart options={chartOptions} series={series} type="donut" height={320} />
      </div>
    </div>
  );
}

